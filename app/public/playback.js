var player;

function initPlayback() {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const token = Cookies.get('access_token');
    if (token) {
      player = new Spotify.Player({
        name: 'Grupp4 Player',
        getOAuthToken: cb => { cb(token); }
      });

      // Error handling
    player.on('initialization_error', e => console.error(e));
    player.on('authentication_error', e => console.error(e));
    player.on('account_error', e => console.error(e));
    player.on('playback_error', e => console.error(e));

    // Playback status updates
    player.on('player_state_changed', state => {
      console.log(state)
      $('#current-track').attr('src', state.track_window.current_track.album.images[0].url);
      $('#current-track-name').text(state.track_window.current_track.name);
    });

    // Ready
    player.on('ready', data => {
      console.log('Ready with Device ID', data.device_id);
      play(data.device_id, Cookies.get('track_id'));
    });

    // Connect to the player!
    player.connect();
    };
  }
}

// Play a specified track on the Web Playback SDK's device ID
function play(device_id, track_id) {
  const token = Cookies.get('access_token');
  if (token && track_id) {
    $.ajax({
     url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
     type: "PUT",
     data: '{"uris": ["spotify:track:' + track_id +'"]}',
     beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + token );},
     success: function(data) {
       console.log(data);
     }
    });
  }
}

function pause() {

}
