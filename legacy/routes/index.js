import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';

var scopes = ['user-read-email', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private'],
    clientId = process.env.SPOTIFY_CLIENT_ID,
    redirectUri = 'https://127.0.0.1:3000/callback';


var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

spotifyApi.clientCredentialsGrant().then(
    function(data) {
        console.log('The access token has been retrieved successfully');
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log(data.body);
        spotifyApi.setRefreshToken(data.body['refresh_token']); // Store the refresh token
        console.log("refresh token: ", data.body['refresh_token']);
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

// Middleware to log the TTL of the Spotify access token
router.use((req, res, next) => {
    if (req.session.spotifyAccessTokenExpiresAt) {
        const ttl = req.session.spotifyAccessTokenExpiresAt - Date.now();
        console.log(`Spotify Access Token TTL: ${ttl > 0 ? ttl / 1000 : 0} seconds`);
    } else {
        console.log('Spotify Access Token TTL: Not available');
    }
    next();
});

import tracks from '../db/tracks.js';
import users from '../db/users.js'; // Ensure this is imported to interact with the user database

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
    if (req.isAuthenticated()) {
        console.log('User is already logged in, redirecting to dashboard');
        return res.redirect('/dashboard');
    }
    console.log('Rendering login page');
    res.render('index', { title: 'Groupify' });
});

/* GET signup page */
router.get('/signup', function(req, res, next) {
    console.log('Rendering signup page');
    res.render('signup');
});

// Callback route to handle Spotify's response
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    console.log('Received state:', state); // Debugging
    console.log('Stored state:', req.session.spotifyAuthState); // Debugging

    // Validate state parameter
    if (state !== req.session.spotifyAuthState) {
        console.error('State mismatch during Spotify callback');
        return res.status(400).send('State mismatch');
    }
    delete req.session.spotifyAuthState; // Clear state from session after validation

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);

        // Extract access and refresh tokens
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];
        const expiresIn = data.body['expires_in'];
        console.log("accessToken: %j", accessToken);
        console.log("refreshToken: %j", refreshToken);
        console.log("expiresIn: %j", expiresIn);

        // Set tokens on the Spotify API instance
        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        // Store tokens in session or database
        req.session.spotifyAccessToken = accessToken;
        req.session.spotifyRefreshToken = refreshToken;
        req.session.spotifyAccessTokenExpiresAt = Date.now() + expiresIn * 1000;

        console.log('Access and refresh tokens set successfully');
        res.redirect('/dashboard'); // Redirect to the dashboard
    } catch (err) {
        console.error('Error during authorization code grant:', err);
        res.status(500).send('Authorization failed');
    }
});

/* User authentication route */
router.post('/login', async (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      if (info.message === 'Incorrect password') {
        return res.status(401).json({ error: 'Incorrect password' });
      }
      if (info.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

router.post('/search', async(req, res) => {
    try {
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
        // TODO: await spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USER_ID, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' + track.id]);
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
    users.register(req.body.username, req.body.password, function(err, user) {
        if (err) {
            console.error('Error during signup:', err);
            return res.status(500).json({ error: 'Signup failed' });
        }
        req.login(user, function(loginErr) {
            if (loginErr) {
                console.error('Error during login after signup:', loginErr);
                return res.status(500).json({ error: 'Login after signup failed' });
            }
            res.redirect('/dashboard');
        });
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

/* Helper function to refresh Spotify access token */
async function refreshSpotifyToken(req, res, next) {
    try {
        // Check if the access token is about to expire
        if (Date.now() >= req.session.spotifyAccessTokenExpiresAt) {
            console.log('Access token expired, refreshing...');
            const data = await spotifyApi.refreshAccessToken();
            console.log('Spotify access token refreshed successfully');

            // Update the Spotify API instance and session with the new token
            spotifyApi.setAccessToken(data.body['access_token']);
            req.session.spotifyAccessToken = data.body['access_token'];
            req.session.spotifyAccessTokenExpiresAt = Date.now() + data.body['expires_in'] * 1000;

            console.log('New access token:', data.body['access_token']);
        }
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('Error refreshing Spotify access token:', err);
        throw new Error('Failed to refresh Spotify access token');
    }
}

// Middleware to ensure the access token is valid
router.use(async (req, res, next) => {
    try {
        if (req.session.spotifyRefreshToken) {
            await refreshSpotifyToken(req, res, next);
        } else {
            console.log('No refresh token available, redirecting to /authorise');
            return res.redirect('/authorise'); // Redirect to reauthenticate
        }
    } catch (err) {
        console.error('Error in token middleware:', err);
        return res.redirect('/authorise'); // Redirect on error
    }
});

/* Load the dashboard */
router.get('/dashboard', isLoggedIn, async (req, res) => {
    try {
        // Ensure the token is valid before making Spotify API calls
        await refreshSpotifyToken(req, res, () => {});

        // Use the Spotify API with the refreshed token
        const userData = await spotifyApi.getMe();
        console.log('User data:', userData.body);

        // Fetch hot and played tracks
        tracks.getHot(function(rows) {
            console.log('Hot tracks retrieved:', rows);
            const ids = rows.map(row => row["SpotifyID"]);

            if (ids.length === 0) {
                console.log('No hot tracks found');
                return res.render('dashboard', { HotJson: [], PlayedJson: [], UserID: req.user["UserID"] });
            }

            spotifyApi.getTracks(ids, {}, function(err, a) {
                if (err) {
                    console.error('Error retrieving tracks from Spotify:', err);
                    return res.status(500).send('Error retrieving tracks from Spotify');
                }
                console.log('Hot tracks retrieved from Spotify:', a["body"]["tracks"]);

                tracks.getPlayed(function(playedrows) {
                    console.log('Played tracks retrieved:', playedrows);
                    const ids2 = playedrows.map(row => row["SpotifyID"]);

                    if (ids2.length === 0) {
                        console.log('No played tracks found');
                        return res.render('dashboard', { HotJson: a["body"]["tracks"], HotVotes: rows, PlayedJson: [], UserID: req.user["UserID"] });
                    }

                    spotifyApi.getTracks(ids2, {}, function(err, b) {
                        if (err) {
                            console.error('Error retrieving played tracks from Spotify:', err);
                            return res.status(500).send('Error retrieving played tracks from Spotify');
                        }
                        console.log('Played tracks retrieved from Spotify:', b["body"]["tracks"]);
                        res.render('dashboard', { HotJson: a["body"]["tracks"], HotVotes: rows, PlayedJson: b["body"]["tracks"], UserID: req.user["UserID"] });
                    });
                });
            });
        });
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.redirect('/authorise'); // Redirect to reauthenticate if an error occurs
    }
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

router.post('/search-suggestions', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters long' });
    }

    const data = await spotifyApi.searchTracks(`track:${query}`, { limit: 5 });
    const results = data.body.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({
        id: artist.id,
        name: artist.name
      })),
      external_urls: track.external_urls,
      preview_url: track.preview_url,
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images
      }
    }));

    res.json(results);
  } catch (err) {
    console.error('Error handling search suggestions:', err);
    res.status(500).json({ error: 'Failed to fetch search suggestions' });
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