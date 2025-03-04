import dotenv from 'dotenv';
import { initializeDatabase, findUserByUsername, pool} from "./db/db.js";
import tracks from './db/tracks.js';
import SpotifyWebApi from 'spotify-web-api-node';
var spotifyApi = new SpotifyWebApi({
	clientId	: process.env.SPOTIFY_CLIENT_ID,
	clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});
spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);

export function updateForeignPlaylist(playbackEnd){
    if (playbackEnd - Date.now() < 45000){
        tracks.getNext(0, function(a){
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


updateForeignPlaylist(Date.now());
