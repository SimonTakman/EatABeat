var player;

function initPlayback() {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const token = Cookies.get('access_token');
    if (token) {
      player = new Spotify.Player({
        name: 'Eat A Beat',
        getOAuthToken: cb => { cb(token); }
      });

      // Emitted when the Spotify.Player fails to instantiate
      // a player capable of playing content in the current environment.
      // Most likely due to the browser not supporting EME protection.
      player.on('initialization_error', e => {
        //alert("This device is not supported by the Spotify Playback SDK. Please start Spotify and play a song before resuming.");
        console.error(e);
        //window.location.href = '/';
        checkDevices(); // Play on another device instead of through playback SDK.
      });
      // Emitted when the Spotify.Player fails
      // to instantiate a valid Spotify connection
      // from the access token provided to getOAuthToken.
      player.on('authentication_error', e => {
        console.error(e);
        window.location.href = '/';
      });
      // Emitted when the user authenticated does not
      // have a valid Spotify Premium subscription.
      player.on('account_error', e => {
        console.error(e);
        checkDevices(); // Play on another device instead of through playback SDK.
      });
      // Emitted when loading and/or playing back a track failed.
      player.on('playback_error', e => {
        console.error(e);
        checkDevices(); // Play on another device instead of through playback SDK.
      });

      // Playback status updates
      player.on('player_state_changed', state => {
        console.log("STATE CHANGED", state);
        if (state.position == 0 && state.paused == false) {
          window.startTime = (new Date()).getTime();
          console.log("NEW START TIME");
        }
      });

      // Connect to the player!
      player.connect();
    }
  }
}

// Play a specified track on the Web Playback SDK's device ID
function play(track_id, device_id) {
  console.log("TRYING TO PLAY");
  const token = Cookies.get('access_token');
  if (!device_id) {
    return new Promise(function(resolve, reject) {
      player.on('ready', data => {
        console.log('Ready with Device ID', data.device_id);

        if (token && track_id) {
          $.ajax({
            url: "https://api.spotify.com/v1/me/player/play?device_id=" + data.device_id,
            type: "PUT",
            data: '{"uris": ["spotify:track:' + track_id +'"]}',
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + token );},
            success: function(data) {
              resolve();

            }
          });
        }
        else
          reject();
      });
    });
  }
  else {
    return new Promise(function(resolve, reject) {
      if (token && track_id) {
        $.ajax({
          url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
          type: "PUT",
          data: '{"uris": ["spotify:track:' + track_id +'"]}',
          beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + token );},
          success: function(data) {
            window.startTime = (new Date()).getTime();
            resolve();
          },
          error: function(data) {
            reject();
          }
        });
      }
      else
        reject();
      });
  }
}
