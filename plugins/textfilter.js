/**
 * Text Filter Plugin
 *
 * @author		Michael Owens
 * @website		http://www.michaelowens.nl
 * @copyright	Michael Owens 2011
 */
var sys = require( 'sys' );

Plugin = exports.Plugin = function( irc ) {
	
	this.name = 'textfilter';
	this.title = 'Woord filter';
	this.version = '0.1';
	this.author = 'Michael Owens';
	
	this.irc = irc;
	
	this.filters = [ 'kanker', 'tyfus', 'tering' ];
	
	this.irc.addTrigger( this, 'addword', this.trigAddword );
	
};

Plugin.prototype.onMessage = function( msg ) {
	
	var c = msg.arguments[ 0 ], // channel
		u = this.irc.user( msg.prefix ), // user
		m = msg.arguments[ 1 ]; // message
	
	var disallow = false;
	for( i = 0, z = this.filters.length; i < z; i++ ) {
		
		if( m.toLowerCase().indexOf( this.filters[ i ] ) != '-1' ) {
			
			disallow = true;
			
		}
		
	}
	
	if( disallow ) {
		
		this.irc.channels[ c ].send( '\002' + u + ':\002 Let op je taalgebruik!' );
		
	}
	
};

Plugin.prototype.trigAddword = function( msg ) {
	
	var c = msg.arguments[ 0 ], // channel
		u = this.irc.user( msg.prefix ), // user
		m = msg.arguments[ 1 ]; // message
	
	var params = m.split( ' ' );
	params.shift();
	
	if( typeof params[ 0 ] == 'undefined' ) {
		
		this.irc.channels[ c ].send( '\002Voorbeeld:\002 .addword <woord>' );
		
	} else {
		
		this.filters.push( params[ 0 ] );
		this.irc.channels[ c ].send( 'Het woord \002' + params[ 0 ] + '\002 is vanaf nu niet meer toegestaan!' );
		
	}
	
};