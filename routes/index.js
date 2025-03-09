import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
var spotifyApi = new SpotifyWebApi();

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

/* User authentication route */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

router.post('/search', async (req, res) => {
  spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
  try {
    console.log(`Search request received for ${req.body.search} from ${req.user["id"]}`);
    const data = await spotifyApi.searchTracks(`track:${req.body.search}`);
    const results = data.body.tracks.items;

    if (results.length === 0) {
      console.log('No tracks found');
      return res.status(404).json({ error: 'No tracks found' });
    }
    const track = results.find(item => item.type === 'track');
    console.log(`Track found: ${track.name}, upvoting...`);

    // Upvote the first track found
    await tracks.upvote(track, req.user["id"]);

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
