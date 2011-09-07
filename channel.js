/**
 * Channel Class
 *
 * @author		Michael Owens
 * @website		http://www.michaelowens.nl
 * @copyright	Michael Owens 2011
 */
var sys = require( 'sys' );

Channel = exports.Channel = function( irc, room, join, password ) {
	
	this.irc = irc;
	this.room = room;
	this.inRoom = false;
	this.password = password;
	
	if( join ) this.join( );
	
};

Channel.prototype.join = function( ) {
	
	this.irc.raw( 'JOIN', this.room, this.password );
	this.inRoom = true;
	
};

Channel.prototype.send = function( msg ) {
	
	this.irc.raw( 'PRIVMSG', this.room, ':' + msg );
	
};