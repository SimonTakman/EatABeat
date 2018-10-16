// server.js
// where your node app starts

// init project
require('dotenv').config()
var express = require('express');
var app = express();

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/game", function (request, response) {
  response.sendFile(__dirname + '/views/game.html');
});


//-------------------------------------------------------------//


// init Spotify API wrapper
var SpotifyWebApi = require('spotify-web-api-node');

// Replace with your redirect URI, required scopes, and show_dialog preference
var isProd = process.env.NODE_ENV == "production";
var redirectUri = (isProd ? 'https://eatabeat.herokuapp.com' : 'http://localhost:3000') + "/callback";
var scopes = ["streaming", "user-read-birthdate", "user-read-email", "user-read-private", "user-modify-playback-state", "user-read-playback-state"];
var showDialog = true;

// The API object we'll use to interact with the API
var spotifyApi = new SpotifyWebApi({
  clientId : process.env.SPOTIFY_ID,
  clientSecret : process.env.SPOTIFY_SECRET,
  redirectUri : redirectUri
});

app.get("/authorize", function (request, response) {
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, null, showDialog);
  //console.log(authorizeURL)
  response.send(authorizeURL);
});

// Exchange Authorization Code for an Access Token
app.get("/callback", function (request, response) {
  var authorizationCode = request.query.code;

  spotifyApi.authorizationCodeGrant(authorizationCode)
  .then(function(data) {
    //console.log(data)
    response.redirect(`/#access_token=${data.body['access_token']}&refresh_token=${data.body['refresh_token']}&expires_in=${data.body['expires_in']}`)
  }, function(err) {
    console.log('Something went wrong when retrieving the access token!', err.message);
  });
});

app.get("/logout", function (request, response) {
  response.redirect('/');
});

app.get('/search', function (request, response) {
  var loggedInSpotifyApi = new SpotifyWebApi();
  //console.log(request.headers['authorization'].split(' ')[1]);
  loggedInSpotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1]);

  let query = 'track:' + request.query.input;

  loggedInSpotifyApi.searchTracks(query, { limit : 5 })
  .then(function(data) {
    response.send(data.body);
  }, function(err) {
    console.log(err)
  });
});

app.get('/trackInfo', function (request, response) {
  var trackInfo = {features: {}, analysis: {}, track: {}};
  var loggedInSpotifyApi = new SpotifyWebApi();
  loggedInSpotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1]);
  
  // Get all data
  var featPromise = loggedInSpotifyApi.getAudioFeaturesForTrack(request.query.track_id).then(data => trackInfo.features = data.body);
  var analysisPromise = loggedInSpotifyApi.getAudioAnalysisForTrack(request.query.track_id).then(data => trackInfo.analysis = data.body);
  var trackPromise = loggedInSpotifyApi.getTrack(request.query.track_id).then(data => trackInfo.track = data.body);

  return Promise.all([featPromise, analysisPromise, trackPromise]).then(() => response.send(trackInfo)).catch(err => console.error(err));
});

app.get('/me', function(request, response) {
  var loggedInSpotifyApi = new SpotifyWebApi();
  loggedInSpotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1]);
  // Get the authenticated user
  loggedInSpotifyApi.getMe()
    .then(function(data) {
      response.send(data.body);
    }, function(err) {
      console.log('Something went wrong!', err);
    });
});

app.get('/playbackState', function(request, response) {
  var loggedInSpotifyApi = new SpotifyWebApi();
  loggedInSpotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1]);
  // Get information about current playing song for signed in user
  loggedInSpotifyApi.getMyCurrentPlaybackState()
    .then(function(data) {
      // Output items
      response.send(data.body);
      //console.log("Now Playing: ",data.body);
    }, function(err) {
      console.log('Something went wrong!', err);
    });
});

app.get('/devices', function(request, response) {
  var loggedInSpotifyApi = new SpotifyWebApi();
  loggedInSpotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1]);
  // Get information about current playing song for signed in user
  loggedInSpotifyApi.getMyDevices()
    .then(function(data) {
      // Output items
      response.send(data.body);
      //console.log("Now Playing: ",data.body);
    }, function(err) {
      console.log('Something went wrong!', err);
    });
});

app.get('/pause', function(request, response) {
  var loggedInSpotifyApi = new SpotifyWebApi();
  loggedInSpotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1]);

  loggedInSpotifyApi.pause()
    .then(function(data) {
      // Output items
      //response.send(data.body);
      //console.log("Now Playing: ",data.body);
    }, function(err) {
      console.log('Something went wrong!', err);
    });
});


//-------------------------------------------------------------//


// listen for requests :)
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
