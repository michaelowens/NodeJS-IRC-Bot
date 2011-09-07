/**
* Global Functionalities and Boot Up
*
* @author		Michael Owens
* @website		http://www.michaelowens.nl
* @copyright	Michael Owens 2011
*/
var sys = require( 'sys' );

Plugin = exports.Plugin = function( irc ) {

	this.name = 'global';
	this.title = 'Global';
	this.version = '0.1';
	this.author = 'Michael Owens';

	this.irc = irc;

	// end of MOTD/MODES
	var that = this;
	this.irc.onReply( this.name, '376', function( msg ) {

		for ( i = 0; i < that.irc.userchannels.length; i++ ) {
			var channelName = that.irc.userchannels[i], password;
			if (typeof(channelName) == "object") {
				password = channelName.password;
				channelName = channelName.name;
			}

			var chan = new Channel( that.irc, channelName, true, password);
			chan.join();

			that.irc.channels[chan.room] = chan;

			chan.send( 'Hey, did you miss me? ;-)' );

		}			      

	} );

};
