/**
 * IRC Bot
 *
 * @author		Michael Owens
 * @website		http://www.michaelowens.nl
 * @copyright	Michael Owens 2011
 */
var sys = require( 'sys' ),
	irc = require( './irc' );

/**
 * Config
 */
var config = {
	host:		'127.0.0.1',
	port:		6667,
	nick:		'NodeBot',
	username:	'NodeBot',
	realname:	'Powered by Michael Owens',
	channel:	'#nodejs',
	command:	'.',
	
	plugins:	[ 'reload', 'gezien', 'textfilter' ]
};

/**
 * Let's power up
 */
var ircClient = new irc.Server( config );
ircClient.connect( );