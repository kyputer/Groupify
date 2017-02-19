require('dotenv').config();
var db = require('./db');
var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi();



var now = parseInt(Date.now() / 1000);
if (process.env.TIME_STAMP - now < 90){
    db.tracks.getNext(0, function(a){
        spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USER_ID,
                                       process.env.SPOTIFY_PLAYLIST_ID,
                                       [a]);
    });
}
