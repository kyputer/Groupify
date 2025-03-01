import dotenv from 'dotenv';
import express from 'express';
var router = express.Router();
import SpotifyWebApi from 'spotify-web-api-node';
var spotifyApi = new SpotifyWebApi();
import passport from 'passport';
import timeout from 'connect-timeout';

/* Here is the authentication middleware */
function isLoggedIn(req, res, next) {
   // if user is authenticated in the session, carry on
   if (req.isAuthenticated())
	   return next();
  // if they aren't redirect them to the home page
   res.redirect('/');
}

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Groupify' });
});
router.get('/login', function(req, res, next) {
  res.render('index', { title: 'Groupify' });
});

/* GET signup page */
router.get('/signup', function(req, res, next) {
  res.render('signup');
});

/* User authentication route */
router.post('/login',
  passport.authenticate('local', { failureRedirect: '/fail' }),
  function(req, res) {
    res.redirect('/dashboard');
});

router.post('/search', function(req, res) {
    // console.log(req.body.search);
    spotifyApi.searchTracks(req.body.search, [], function(err, data){
        if(err==null){
            // console.log(data["body"]["tracks"]["items"][0]);
            db.tracks.upvote(data["body"]["tracks"]["items"][0]["id"], req.user["UserID"]);
            res.redirect('/dashboard');
        }
    });
});

router.post('/signup',
  function(req, res) {
    db.users.register(req.body.username, req.body.password, function(err, rows){
      res.redirect('/login');
    });
});

/* User register route */
router.post('/register', function(req, res){
    db.users.register(request.body.username, request.body.password);
});

/* Load the dashboard */
router.get('/dashboard', isLoggedIn, function(req, res) {
    db.tracks.getHot(function (rows){
        var ids = [];
        for (var i=0;i<rows.length;i++) ids.push(rows[i]["SpotifyID"]);
        if (ids.length==0) return res.render('dashboard', {HotJson:[], PlayedJson:[], UserID: req.user["UserID"]});
        spotifyApi.getTracks(ids, {}, function(err, a){


            db.tracks.getPlayed(function (playedrows){
                var ids2 = [];
                for (var j=0;j<playedrows.length;j++) ids2.push(playedrows[j]["SpotifyID"]);
                spotifyApi.getTracks(ids2, {}, function(err, b){
                    if (err) console.log(err);
                    res.render('dashboard', { HotJson: a["body"]["tracks"], HotVotes: rows, PlayedJson: b["body"]["tracks"], UserID: req.user["UserID"]});
                });
            });
         });
    });
});

router.post('/upvote', function (req, res){
    console.log(req.body.SpotifyID);
    db.tracks.upvote(req.body.SpotifyID, req.body.UserID);
    return;
});

router.post('/downvote', function (req, res){
    console.log(req.body.SpotifyID);
    db.tracks.downvote(req.body.SpotifyID, req.body.UserID);
    return;
});

export default router;





/* SPOTIFY */
var spotifyApi = new SpotifyWebApi({
	clientId	: process.env.SPOTIFY_CLIENT_ID,
	clientSecret	: process.env.SPOTIFY_CLIENT_SECRET,
	redirectUri	: process.env.SPOTIFY_REDIRECT_URI//.replace(/\//g, "%2F").replace(/\:/g, "%3A")
});
spotifyApi.setAccessToken(process.env.ACCESS_TOKEN);

router.get('/authorize', function(req, res) {
	var scopes = ['playlist-modify-public', 'playlist-modify-private'];
	var state = new Date().getTime();
	var authoriseURL = spotifyApi.createAuthorizeURL(scopes, state);
	res.redirect(authoriseURL);
});

router.get('/callback', function(req, res) {
	spotifyApi.authorizationCodeGrant(req.query.code)
		.then(function(data) {
            console.log(data.body['access_token']);
			spotifyApi.setAccessToken(data.body['access_token']);
			spotifyApi.setRefreshToken(data.body['refresh_token']);
			return res.redirect('/');
		}, function(err) {
			return res.sent(err);
		});
});




/* SPOTIFY CRAP BELOW
//TODO
var spotifyApi = new SpotifyWebApi({
	clientId	: process.env.SPOTIFY_CLIENT_KEY,
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
	return res.send('<a href="/authorise">Authorise</a>');
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


*/
