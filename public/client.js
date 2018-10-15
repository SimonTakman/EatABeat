// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

function refreshPage() {
  window.location.reload();
}

function checkDevices() {
  if (Cookies.get("ext_device_id")) return;
  $('#game-view').hide();
  $('#devices').show();
  access_token = Cookies.get('access_token');

  if (access_token) {
    $.get({url: '/devices', headers: {"Authorization": `Bearer ${access_token}`}}, function(data) {
      //console.log(data);
      if (data.devices.length > 0) {
        data.devices.forEach(function(device) {
          var dev = $('<a href="#"><h4>' + device.name + '</h4></a>');
          dev.on('click', function() {
            $('#devices').fadeOut(500, function() {
              Cookies.set("ext_device_id", device.id);
              refreshPage();
            });
          });
          dev.appendTo('#deviceList');
        });
        $('#chooseDevice').fadeIn(500);
      } else {
        $('#startSpotify').fadeIn(500);
      }
    });
  } else {
    window.location.href = '/';
  }
}

$(function() {
  var access_token, track_id;

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
    $('#game-view').show();
    initPlayback();
  }
  else {
    // Not logged in
    window.location.href = '/';
  }
});
