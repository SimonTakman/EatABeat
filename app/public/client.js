// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  $('body').hide();
  var access_token, track_id, device_id; // Device id used for playback SDK

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
  if (hash.track_id) {
    Cookies.set('track_id', hash.track_id);
    window.location.href = '/game';
  }

  access_token = Cookies.get('access_token');
  track_id = Cookies.get('track_id');
  if (access_token && track_id) {
    // Logged in
    //console.log("Logged in");
    $('body').show();
    // Get logged in user info
    $.get({url: '/me', headers: {"Authorization": `Bearer ${access_token}`}}, function(data) {
      // "Data" is the array of track objects we get from the API. See server.js for the function that returns it.
      console.log(data);
    });
    //initPlayback();

  }
  else {
    // Not logged in
    window.location.href = '/';
  }
});
