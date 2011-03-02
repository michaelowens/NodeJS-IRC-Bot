/**
 * Reload Plugin
 *
 * @author		Michael Owens
 * @website		http://www.michaelowens.nl
 * @copyright	Michael Owens 2011
 */
var sys = require( 'sys' );

Plugin = exports.Plugin = function( irc ) {
	
	this.name = 'reload';
	this.title = 'Plugin Reloader';
	this.version = '0.1';
	this.author = 'Michael Owens';
	
	this.irc = irc;
	
	this.irc.addTrigger( this, 'reload', this.trigGezien );
	
};

Plugin.prototype.trigGezien = function( msg ) {
	
	var c = msg.arguments[ 0 ], // channel
		u = this.irc.user( msg.prefix ), // user
		m = msg.arguments[ 1 ]; // message
	
	var params = m.split( ' ' );
	params.shift();
	
	this.irc.channels[ c ].send( 'Reloading plugin: ' + params[ 0 ] );
	
	this.irc.loadPlugin( params[ 0 ] );
	
	
};