require('dotenv').config();
var db = require('./db');
var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
	clientId	: process.env.SPOTIFY_CLIENT_ID,
	clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});
console.log(process.env.SPOTIFY_CLIENT_ID);
spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);

var updateForeignPlaylist = function(playbackEnd){
    if (playbackEnd - Date.now() < 45000){
        db.tracks.getNext(0, function(a){
            spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USER_ID,
                                           process.env.SPOTIFY_PLAYLIST_ID,
                                           ['spotify:track:'+a["SpotifyID"]], {}, function(){
                                               spotifyApi.getTrack(a["SpotifyID"], {}, function(err, b){
												   db.tracks.pushBlacklist(a["TrackID"]);
												   if (err) console.log(err);
												   else playbackEnd += b['body']['duration_ms'];
                                                   setTimeout(function(){updateForeignPlaylist(playbackEnd);}, 20000); // check every 20 seconds
                                               });
                                           });
        });
    } else {
        setTimeout(function(){updateForeignPlaylist(playbackEnd);}, 20000);
    }
}

// module.exports.updateForeignPlaylist = updateForeignPlaylist;

updateForeignPlaylist(Date.now());
