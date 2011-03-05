/**
 * IRC Class
 *
 * @author		Michael Owens
 * @website		http://www.michaelowens.nl
 * @copyright	Michael Owens 2011
 */

var sys = require( 'sys' ),
	net = require( 'net' ),
	fs = require( 'fs' ),
	channel = require( './channel' );

Server = exports.Server = function( config ) {
	
	this.initialize( config );
	
};

sys.inherits( Server, process.EventEmitter );

Server.prototype.initialize = function( config ) {
	
	this.host = config.host || '127.0.0.1';
	this.port = config.port || 6667;
	this.nick = config.nick || 'MikeBot';
	this.username = config.username || 'MikeBot';
	this.realname = config.realname || 'Powered by MikeBot';
	this.mainchannel = config.channel || null;
	this.command = config.command || '.';
	this.channels = [];
	this.hooks = [];
	this.triggers = [];
	this.replies = [];
	
	this.connection = null;
	this.buffer = "";
	this.encoding = "utf8";
	this.timeout = 60*60*1000;
	
	this.debug = config.debug || false;
	
	/*
	 * Boot Plugins
	 */
	this.plugins = [];
	
	for( i = 0, z = config.plugins.length; i < z; i++ ) {
		
		var p = config.plugins[ i ];
		this.loadPlugin( p );
		
	}
	
};

Server.prototype.connect = function( ) {
	
	var c = this.connection = net.createConnection( this.port, this.host );
    c.setEncoding( this.encoding );
    c.setTimeout( this.timeout );
	
	this.addListener( 'connect', this.onConnect );
    this.addListener( 'data', this.onReceive );
    this.addListener( 'eof', this.onEOF );
    this.addListener( 'timeout', this.onTimeout );
    this.addListener( 'close', this.onClose );
	
};

Server.prototype.disconnect = function( reason ) {
	
    if( this.connection.readyState !== 'closed' ) {
		
        this.connection.close( );
        sys.puts( 'disconnected (' + reason + ')' );
        
    }
    
};

Server.prototype.onConnect = function( ) {
	
	sys.puts( 'connected' );
	
    this.raw( 'NICK', this.nick );
    this.raw( 'USER', this.username, '0', '*', ':' + this.realname );
    
    this.emit( 'connect' );
	
};

Server.prototype.onReceive = function( chunk ) {
	
	this.buffer += chunk;

    while( this.buffer ) {
    	
        var offset = this.buffer.indexOf( "\r\n" );
        if( offset < 0 ) { 
            return;
        }

        var msg = this.buffer.slice( 0, offset );
        this.buffer = this.buffer.slice( offset + 2 );
        
        if( this.debug ) sys.puts( "< " + msg );

        msg = this.parse( msg );
		
        this.onMessage( msg );
        
    }
	
};

Server.prototype.onMessage = function( msg ) {
	
	if( this.debug ) {
		sys.puts( '++ command: ' + msg.command );
		sys.puts( '++ arguments: ' + msg.arguments );
		sys.puts( '++ prefix: ' + msg.prefix );
		sys.puts( '++ lastarg: ' + msg.lastarg );
	}
	
	var c, // channel
		u, // user
		m; // message
	switch( msg.command ){
		case 'PING':
			this.raw( 'PONG', msg.arguments );
			break;
			
		case 'PRIVMSG':
			// Look for triggers
			m = msg.arguments[ 1 ];
			if( m.substring( 0, 1 ) == this.command ) {
				
				var trigger = m.split( ' ' )[ 0 ].substring( 1, m.length );
				if( typeof this.triggers[ trigger ] != 'undefined' ) {
					
					var trig = this.triggers[ trigger ];
					trig.callback.apply( this.plugins[ trig.plugin ], arguments );
					
				}
				
			}
			this.emit( 'message', msg );
			break;
			
		case 'JOIN':
			this.emit( 'join', msg );
			break;
			
		case 'PART':
			this.emit( 'part', msg );
			break;
			
		case 'QUIT':
			this.emit( 'quit', msg );
			break;
			
		case 'NICK':
			this.emit( 'nick', msg );
			break;
	}
	
	this.emit( msg.command, msg );
	this.emit( 'data', msg );
    
};

Server.prototype.user = function( mask ){

	var match = mask.match( /([^!]+)![^@]+@.+/ );
	if( !match ) throw new TypeError( "Erroneus (incomplete?) mask: " + mask );
	match = match[ 1 ];
	return match;
	
}

Server.prototype.parse = function( text ) {
	
	if ( typeof( text ) != "string" )
		return false;
	
	var tmp = text.split(" ");
	
	if ( tmp.length < 2 )
		return false;
	
	var prefix    = null;
	var command   = null;
	var lastarg   = null;
	var arguments = [];
	
	for ( var i = 0, j = tmp.length; i < j; i++ ) {
		
		if ( i == 0 && tmp[ i ].indexOf( ":" ) == 0 )
			prefix = tmp[ 0 ].substr( 1 );
		
		else if ( tmp[ i ] == "" )
			continue;
		
		else if ( !command && tmp[ i ].indexOf(":") != 0 )
			command = tmp[ i ].toUpperCase();
		
		else if ( tmp[ i ].indexOf( ":" ) == 0 ) {
		
			tmp[ i ] = tmp[ i ].substr(1);
			tmp.splice( 0, i );
			arguments.push( tmp.join( " " ) );
			lastarg = arguments.length - 1;
			break;
		
		} else
			arguments.push( tmp[ i ] );
		
	}
	
	return {
		prefix: prefix,
		command: command,
		arguments: arguments,
		lastarg: lastarg,
		orig: text
	};

};

Server.prototype.onEOF = function( ) {
    this.disconnect( 'EOF' );
};

Server.prototype.onTimeout = function( ) {
    this.disconnect( 'timeout' );
};

Server.prototype.onClose = function( ) {
    this.disconnect( 'close' );
};

Server.prototype.raw = function( cmd ) {
	
    if( this.connection.readyState !== "open" ) {
        return this.disconnect( "cannot send with readyState " + this.connection.readyState );
    }

    var msg = Array.prototype.slice.call( arguments, 1 ).join( ' ' ) + "\r\n";

    if( this.debug ) sys.puts( '>' + cmd + ' ' + msg );
	
    this.connection.write( cmd + " " + msg, this.encoding );
    
};

Server.prototype.addListener = function( ev, f ) {
	
	var that = this;
	return this.connection.addListener( ev, ( function( ) {
		
		return function( ) {
			f.apply( that, arguments )
		};
		
	} )() );
	
};

Server.prototype.addPluginListener = function( plugin, ev, f ) {
		
	if( typeof this.hooks[ plugin ] == 'undefined' ) this.hooks[ plugin ] = [];
	
	var callback = ( function( ) {
		
		return function( ) {
			f.apply( that, arguments )
		};
		
	} )();
	
	this.hooks[ plugin ].push( { event: ev, callback: callback } );
	
	var that = this.plugins[ plugin ];
	return this.on( ev, callback );
	
};

Server.prototype.loadPlugin = function( name ) {
	
	// If reloading, remove prior instance
	if( typeof this.plugins[ name ] != 'undefined' ) {
		
		delete this.plugins[ name ];
		
		if( typeof this.hooks[ name ] != 'undefined' ) {
			
			for( var hook in this.hooks[ name ] ) {
				
				this.removeListener( this.hooks[ name ][ hook ].event, this.hooks[ name ][ hook ].callback );
				
			}
			
		}
		
		if( typeof this.replies[ name ] != 'undefined' ) {
			
			for( var reply in this.replies[ name ] ) {
				
				this.removeListener( this.replies[ name ][ reply ].event, this.replies[ name ][ reply ].callback );
				
			}
			
		}
		
		for( var trig in this.triggers ) {
			
			if( this.triggers[ trig ].plugin == name ) {
				
				delete this.triggers[ trig ];
				
			}
			
		}
		
	}
	
	var that = this;
	fs.readFile( './plugins/' + name + '.js', 'utf8', function( err, data ) {
		
		if( err ) {
			
			sys.puts( err );
			
		} else {
			
			eval( data );
			
			that.plugins[ name ] = new Plugin( that );
			
			/*
			 * Hooks
			 */
			if( typeof that.plugins[ name ].onConnect == 'function' ) that.addPluginListener( name, 'connect', that.plugins[ name ].onConnect );
			if( typeof that.plugins[ name ].onData == 'function' ) that.addPluginListener( name, 'data', that.plugins[ name ].onData );
			if( typeof that.plugins[ name ].onMessage == 'function' ) that.addPluginListener( name, 'message', that.plugins[ name ].onMessage );
			if( typeof that.plugins[ name ].onJoin == 'function' ) that.addPluginListener( name, 'join', that.plugins[ name ].onJoin );
			if( typeof that.plugins[ name ].onPart == 'function' ) that.addPluginListener( name, 'part', that.plugins[ name ].onPart );
			if( typeof that.plugins[ name ].onQuit == 'function' ) that.addPluginListener( name, 'quit', that.plugins[ name ].onQuit );
			if( typeof that.plugins[ name ].onNick == 'function' ) that.addPluginListener( name, 'nick', that.plugins[ name ].onNick );
			
		}
		
	} );
	
};

Server.prototype.addTrigger = function( plugin, trigger, callback ) {
	
	if( typeof this.triggers[ trigger ] == 'undefined' ) {
		
		this.triggers[ trigger ] = { plugin: plugin.name, callback: callback };
		
	}
	
};

Server.prototype.onReply = function( plugin, ev, f ) {
		
	if( typeof this.replies[ plugin ] == 'undefined' ) this.replies[ plugin ] = [];
	
	var callback = ( function( ) {
		
		return function( ) {
			f.apply( that, arguments )
		};
		
	} )();
	
	this.replies[ plugin ].push( { event: ev, callback: callback } );
	
	var that = this.plugins[ plugin ];
	return this.on( ev, callback );
	
};