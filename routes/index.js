import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// router.get('/callback', function(req, res) {
//   spotifyApi.authorizationCodeGrant(req.query.code)
//     .then(function(data) {
//       spotifyApi.setAccessToken(data.body['access_token']);
//       spotifyApi.setRefreshToke(data.body['refresh_token']);
//       return res.redirect('/');
//     }, function(err) {
//       return res.sent(err);
//     });
// });


// Refresh access token initially
spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('The access token has been retrieved successfully');
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.error('Failed to retrieve an access token', err);
  }
);

const router = express.Router();

// Middleware to log each request
router.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

import tracks from '../db/tracks.js';
import users from '../db/users.js';

import passport from 'passport';

/* Here is the authentication middleware */
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

/* GET login page. */
router.get('/', function(req, res, next) {
  console.log('Rendering login page');
  // res.send('<a href="/authorise">Authorise</a>');
  res.render('index', { title: 'Groupify' });
});

router.get('/login', function(req, res, next) {
  console.log('Rendering login page');
  res.render('index', { title: 'Groupify' });
});

/* GET signup page */
router.get('/signup', function(req, res, next) {
  console.log('Rendering signup page');
  res.render('signup');
});

router.get('/authorise', function(req, res) {
  var scopes = ['playlist-modify-public', 'playlist-modify-private'];
  var state = new Date().getTime();
  var authoriseURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authoriseURL);
});

router.get('/callback', function(req, res) {
  console.log("callback");
  spotifyApi.authorizationCodeGrant(req.query.code)
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      return res.redirect('/');
    }, function(err) {
      return res.sent(err);
    });
});

/* User authentication route */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

router.post('/search', async (req, res) => {
  try {
    console.log(`Search request received for ${req.body.search} from ${req.user["id"]}`);
    console.log(`Search request received for ${req.body.search} from ${req.user ? req.user["id"] : 'Anonymous'}`);

    const data = await spotifyApi.searchTracks(`track:${req.body.search}`);
    const results = data.body.tracks.items;

    if (results.length === 0) {
      console.log('No tracks found');
      return res.status(404).json({ error: 'No tracks found' });
    }
    const track = results.find(item => item.type === 'track');
    console.log(`Track found: ${track.name}, upvoting...`);

    // Upvote the first track found
    if (req.user) {
      await tracks.upvote(track, req.user["id"]);
    }

    // Add track to playlist
    await spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USER_ID, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' + track.id]);
    console.log(`Track added to playlist: ${track.name} by ${track.artists[0].name}`);

    // Redirect to the dashboard after upvoting
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error handling search request:', err);
    res.status(500).json({ error: 'Search request failed' });
  }
});

router.post('/signup', function(req, res) {
  console.log('Signup request received');
  console.log(req.body);
  users.register(req.body.username, req.body.password, function(err, rows) {
    if (err) {
      console.error('Error during signup:', err);
      return res.status(500).json({ error: 'Signup failed' });
    }
    res.redirect('/login');
  });
});

router.post('/register', function(req, res) {
  console.log('Register request received');
  console.log(req.body);
  users.register(req.body.username, req.body.password, function(err) {
    if (err) {
      console.error('Error during registration:', err);
      return res.status(500).send('Registration failed');
    }
    res.redirect('/login');
  });
});

/* Load the dashboard */
router.get('/dashboard', isLoggedIn, function(req, res) {
  console.log('Loading dashboard');
  tracks.getHot(function (rows){
    console.log('Hot tracks retrieved:', rows);
    var ids = [];
    for (var i=0;i<rows.length;i++) ids.push(rows[i]["SpotifyID"]);
    if (ids.length==0) {
      console.log('No hot tracks found');
      return res.render('dashboard', {HotJson:[], PlayedJson:[], UserID: req.user["UserID"]});
    }
    spotifyApi.getTracks(ids, {}, function(err, a){
      if (err) {
        console.error('Error retrieving tracks from Spotify:', err);
        return res.status(500).send('Error retrieving tracks from Spotify');
      }
      console.log('Hot tracks retrieved from Spotify:', a["body"]["tracks"]);
      tracks.getPlayed(function (playedrows){
        console.log('Played tracks retrieved:', playedrows);
        var ids2 = [];
        for (var j=0;j<playedrows.length;j++) ids2.push(playedrows[j]["SpotifyID"]);
        if (ids2.length == 0) {
          console.log('No played tracks found');
          return res.render('dashboard', { HotJson: a["body"]["tracks"], HotVotes: rows, PlayedJson: [], UserID: req.user["UserID"] });
        }
        spotifyApi.getTracks(ids2, {}, function(err, b){
          if (err) {
            console.error('Error retrieving played tracks from Spotify:', err);
            return res.status(500).send('Error retrieving played tracks from Spotify');
          }
          console.log('Played tracks retrieved from Spotify:', b["body"]["tracks"]);
          res.render('dashboard', { HotJson: a["body"]["tracks"], HotVotes: rows, PlayedJson: b["body"]["tracks"], UserID: req.user["UserID"]});
        });
      });
    });
  });
});

router.post('/upvote', async function(req, res) {
  console.log('Upvote request received');
  console.log(req.body.SpotifyID);
  try {
    await tracks.upvote({ id: req.body.SpotifyID }, req.user['id']);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error during upvote:', err);
    res.status(500).json({ error: 'Upvote failed' });
  }
});

router.post('/downvote', async function(req, res) {
  console.log('Downvote request received');
  console.log(req.body.SpotifyID);
  if (!req.user['id']) {
    console.error('User id is missing in the request body');
    return res.status(400).json({ error: 'User id is required' });
  }
  try {
    await tracks.downvote(req.body.SpotifyID, req.user['id']);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error during downvote:', err);
    res.status(500).json({ error: 'Downvote failed' });
  }
});

export default router;



/* SPOTIFY CRAP B	OW
//TODO
var spotifyApi = new SpotifyWebApi({st
  cl	entId	: process.env.SPOTIFY_CLIENT_KEY,
  clientSecret	: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri	: process.env.SPOTIFY_REDIRECT_URI
});

router.get('/', function(req, res) {
  if(spotifyApi.getAccessToken()){
    res.redirect('' + process.env.SLACK_URI + '');
  }
  return res.send('<a href="/authorise">Authorise</a>');
});

router.get('/authorise', function(req, res) {
  var scopes = ['playlist-modify-public', 'playlist-modify-private'];
  var state = new Date().getTime();
  var authoriseURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authoriseURL);
});

router.get('/callback', function(req, res) {
  spotifyApi.authorizationCodeGrant(req.query.code)
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToke(data.body['refresh_token']);
      return res.redirect('/');
    }, function(err) {
      return res.sent(err);
    });
});

router.use('/store', function(req, res, next){
  if(req.body.token !== process.env.SLACK_TOKEN) {
    return res.status(500).send('Cross site request forgerizzle!');
  }
  next();
});

router.post('/store', function(req, res){
  spotifyApi.refreshAccessToken()
    .then(function(data){
      spotifyApi.setAccessToken(data.body['access_token']);
      if(data.body['refresh_token']){
        SpotifyWebApi.setRefreshToken(data.body['refresh_token']);
      }
      if(req.body.text.trim().length===0 || req.body.text.trim() === 'help'){
        return res.send('Enter then name of a song ad artist separated by a "-"');
      }
      if(req.body.text.indexOf(' - ') === -1){
        var query = 'track:' + req.body.text;
      }else{
        var pieces = req.body.text.split(' - ');
        var query = 'artist:' + pieces[0].trim() + ' track:' + pieces[1].trim();
      }
      spotifyApi.searchTracks(query)
        .then(function(data){
          var results = data.body.tracks.items;
          if(results.length === 0){
            return res.send('Could not locate track.');
          }
          var track = results[0];
          spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' + track.id])
            .then(function(data){
              return res.send({'response_type': 'in_channel', 'text': 'Added track: *<' + track.name + '>* by *' + track.artists[0].name + '*'});
            }, function(err){
              return res.send(err.message);
        });
      }, function(err){
        return res.send(err.message);
      });
      }, function(err){
        return res.send('Could not refresh access token. You probably need to re-authorise yourself from your app\'s homepage.');
      });
  });

router.get('/', function(req, res) {
  if(spotifyApi.getAccessToken()){
//TODO		//res.redirect('' + process.env
  }
  return res.send('<a hre		authorise">Authorise</a>');
});

router.use('/store', funct		req, res, next){
  if(req.body.token !== process.env.SLACK_T		) {
    return res.status(500).send('Cross site request forgerizzle!');
  }
  next();
});

router.post('/store', function(req, res){
  spotifyApi.refreshAccessToken()
    .then(function(data){
      spotifyApi.setAccessToken(data.body['access_token']);
      if(data.body['refresh_token']){
        SpotifyWebApi.setRefreshToken(data.body['refresh_token']);
      }
      if(req.body.text.trim().length===0 || req.body.text.trim() === 'help'){
        return res.send('Enter then name of a song ad artist separated by a "-"');
      }
      if(req.body.text.indexOf(' - ') === -1){
        var query = 'track:' + req.body.text;
      }else{
        var pieces = req.body.text.split(' - ');
        var query = 'artist:' + pieces[0].trim() + ' track:' + pieces[1].trim();
      }
      spotifyApi.searchTracks(query)
        .then(function(data){
          var results = data.body.tracks.items;
          if(results.length === 0){
            return res.send('Could not locate track.');
          }
          var track = results[0];
          spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' + track.id])
            .then(function(data){
              return res.send({'response_type': 'in_channel', 'text': 'Added track: *<' + track.name + '>* by *' + track.artists[0].name + '*'});
            }, function(err){
              return res.send(err.message);
        });
      }, function(err){
        return res.send(err.message);
      });
      }, function(err){
        return res.send('Could not refresh access token. You probably need to re-authorise yourself from your app\'s homepage.');
      });
});*/

