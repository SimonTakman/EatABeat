// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  var access_token;
  $('#logout').hide();
  $('#login').hide();

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
    $('#logout').show();
    $('#login').hide();
    // Get logged in user info
    $.get({url: '/me', headers: {"Authorization": `Bearer ${access_token}`}}, function(data) {
      // "Data" is the array of track objects we get from the API. See server.js for the function that returns it.
      console.log(data);
    });
    initPlayback(access_token);
  }
  else {
    // Not logged in
    $('#logout').hide();
    $('#login').show();
  }

});
