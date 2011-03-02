/**
 * Last Seen Plugin
 *
 * @author		Michael Owens
 * @website		http://www.michaelowens.nl
 * @copyright	Michael Owens 2011
 */
var sys = require( 'sys' );

Plugin = exports.Plugin = function( irc ) {
	
	this.name = 'gezien';
	this.title = 'Laatst Gezien';
	this.version = '0.1';
	this.author = 'Michael Owens';
	
	this.irc = irc;
	
	this.gezien = [];
	
	this.irc.addTrigger( this, 'gezien', this.trigGezien );
	
};

Plugin.prototype.onMessage = function( msg ) {
	this.updateUser( msg );
};

Plugin.prototype.onJoin = function( msg ) {
	this.updateUser( msg );
};

Plugin.prototype.onPart = function( msg ) {
	this.updateUser( msg );
};

Plugin.prototype.onQuit = function( msg ) {
	this.updateUser( msg );
};

Plugin.prototype.onNick = function( msg ) {
	this.updateUser( msg, true );
};

Plugin.prototype.updateUser = function( msg, argument ) {
	
	var u = this.irc.user( msg.prefix );
	this.gezien[ u.toLowerCase() ] = new Date( );
	
	if( typeof argument != 'undefined' ) {
				
		var u = msg.arguments[ 0 ];
		this.gezien[ u.toLowerCase() ] = new Date( );
		
	}
	
}

Plugin.prototype.trigGezien = function( msg ) {
	
	var c = msg.arguments[ 0 ], // channel
		u = this.irc.user( msg.prefix ), // user
		m = msg.arguments[ 1 ]; // message
	
	var params = m.split( ' ' );
	params.shift();
	
	if( typeof params[ 0 ] == 'undefined' ) {
		
		this.irc.channels[ c ].send( '\002Voorbeeld:\002 .gezien <naam>' );
		
	} else {
		
		var seek = params[ 0 ].toLowerCase();
		
		if( typeof this.gezien[ seek ] == 'undefined' ) {
			
			this.irc.channels[ c ].send( 'Ik heb \002' + params[ 0 ] + '\002 nog nooit gezien!' );
			
		} else {
			
			var dat = this.gezien[ seek ];
			var lastDate = dat.getDay() + '-' + dat.getMonth() + '-' + dat.getFullYear();
			var lastTime = dat.getHours() + ':' + dat.getMinutes() + ':' + dat.getSeconds();
			
			this.irc.channels[ c ].send( 'Ik heb \002' + params[ 0 ] + '\002 voor het laatst gezien op: \002' + lastDate + '\002 om \002' + lastTime + '\002' );
			
		}
		
	}
	
};