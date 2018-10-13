// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

var access_token, device_id; // Device id used for playback SDK
$('#loggedIn').hide();
$('#loggedOut').hide();

$('#login').click(function() {
  // Call the authorize endpoint, which will return an authorize URL, then redirect to that URL
  $.get('/authorize', function(data) {
    console.log(data)
    window.location = data;
  });
});

$('#logout').click(function() {
  Cookies.remove('access_token');
  window.location.href = '/';
});

const hash = window.location.hash
  .substring(1)
  .split('&')
  .reduce(function (initial, item) {
    if (item) {
      var parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
  window.location.hash = '';

if (hash.access_token) {
  var expires_in = new Date(new Date().getTime() + hash.expires_in*1000);
  Cookies.set('access_token', hash.access_token, {expires: expires_in});
  console.log(hash.expires_in);
  window.location.href = '/';
}

access_token = Cookies.get('access_token');
if (access_token) {
  // Logged in
  //console.log("Logged in");
  $('#loggedIn').show();
  $('#loggedOut').hide();
  // Get logged in user info
  $.get({url: '/me', headers: {"Authorization": `Bearer ${access_token}`}}, function(data) {
    // "Data" is the array of track objects we get from the API. See server.js for the function that returns it.
    console.log(data);
  });
}
else {
  // Not logged in
  $('#loggedIn').hide();
  $('#loggedOut').show();
}

// Make Enter key press search button
var input = document.getElementById("search");
input.addEventListener("keyup", function(event) {
  event.preventDefault();
  if (event.keyCode === 13) {
      $('#searchBtn').click();
  }
});

function search() {
  var input = $('#search').val();
  $.get({url: '/search', headers: {"Authorization": `Bearer ${access_token}`}, data: {input: input}}, function(data) {
    $('#searchResults').empty();
    // "Data" is the array of track objects we get from the API. See server.js for the function that returns it.
    data.tracks.items.forEach(function(track) {
      var trackName = $('<li><a href="#">' + track.name + '</a></li>');
      trackName.on('click', function() {
        window.location.href = `/game/#track_id=${track.id}`;
      });
      trackName.appendTo('#searchResults');
    });

    console.log(data);
  });
}
