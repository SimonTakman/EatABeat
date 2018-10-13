// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


//-------------------------------------------------------------//


// init Spotify API wrapper
var SpotifyWebApi = require('spotify-web-api-node');

// Replace with your redirect URI, required scopes, and show_dialog preference
var redirectUri = 'http://localhost:3000/callback';
var scopes = ["streaming", "user-read-birthdate", "user-read-email", "user-read-private"];
var showDialog = true;

// The API object we'll use to interact with the API
var spotifyApi = new SpotifyWebApi({
  clientId : '0ff9af57eeaf4b1d9b60956b8eda4994',
  clientSecret : 'cf9f5afdcb59433f86d71d1c62caf37d',
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

  let query = 'track:' + request.query.query;

  loggedInSpotifyApi.searchTracks(query)
  .then(function(data) {
    response.send(data.body);
  }, function(err) {
    console.log(err)
  });
});

app.get('/trackInfo', function (request, response) {
  var trackInfo = {featuresBody: {}, analysisBody: {}};
  var loggedInSpotifyApi = new SpotifyWebApi();
  loggedInSpotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1]);
  /* Get Audio Features for a Track */
  loggedInSpotifyApi.getAudioFeaturesForTrack(request.trackURI)
    .then(function(data) {
      trackInfo.featuresBody = data.body;
      //console.log(data.body);
    }, function(err) {
      console.log(err);
    });

  /* Get Audio Analysis for a Track */
  loggedInSpotifyApi.getAudioAnalysisForTrack(request.trackURI)
    .then(function(data) {
      trackInfo.analysisBody = data.body;
      //console.log(data.body);
    }, function(err) {
      console.log(err);
    });

    response.send(trackInfo);
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


//-------------------------------------------------------------//


// listen for requests :)
var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
