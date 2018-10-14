// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

var access_token, device_id; // Device id used for playback SDK
$('#loggedIn').hide();
$('#loggedOut').hide();
$('#searchResults').hide();

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
  $('#loggedIn').fadeIn(500);
  $('#loggedOut').hide();
  // Get logged in user info
  $.get({url: '/me', headers: {"Authorization": `Bearer ${access_token}`}}, function(data) {
    // "Data" is the array of track objects we get from the API. See server.js for the function that returns it.
    if (data.images.length > 0) {
      $('#avatar').attr("src", data.images[0].url);
      $('#avatar').attr("width", "40px");
      $('#avatar').css("border-radius", "50%");
      $('#avatar').css("float", "left");
    }
    $('#displayName').text(data.display_name);
  });
}
else {
  // Not logged in
  $('#loggedIn').hide();
  $('#loggedOut').fadeIn(500);
}

// Make Enter key press search button
var input = document.getElementById("search");
input.addEventListener("keyup", function(event) {
  event.preventDefault();
  if (event.keyCode === 13) {
      search();
  }
});

function search() {
  $('#searchResults').fadeOut(500);
  $('#logoLoggedIn').fadeOut(200);
  $('#searchBox').animate({top: '150px'}, 300, function () {
    var input = $('#search').val();
    $.get({url: '/search', headers: {"Authorization": `Bearer ${access_token}`}, data: {input: input}}, function(data) {

      /* Build search results */
      $('#searchResults').empty();
      //var results = $('<h3>Results for: ' + input + ' (' + data.tracks.items.length + ' out of ' + data.tracks.total + ')</h3>');
      //results.appendTo('#searchResults');

      // "Data" is the array of track objects we get from the API. See server.js for the function that returns it.
      data.tracks.items.forEach(function(track) {
        var card = $('<div></div>');
        card.addClass("card");
        card.on('click', function() {
          window.location.href = `/game/#track_id=${track.id}`;
        });

        var cover = $('<img>');
        cover.attr("src", track.album.images[0].url);
        cover.attr("width", "200px");
        cover.css("border-radius", "30px 30px 0 0");
        cover.appendTo(card);

        var trackName = $('<h5 style="font-size: 20px;">' + track.name + '</h5>');
        trackName.appendTo(card);

        var trackArtist = $('<h4>' + track.artists[0].name + '</h4>');
        trackArtist.appendTo(card);
        card.appendTo('#searchResults');
      });
      $('#searchResults').fadeIn(500);
      console.log(data);
    });
  });
}

(function() {
  /* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
  particlesJS.load('particles', 'assets/particles.json', function() {
    console.log('callback - particles.js config loaded');
  });
}());

if(window.innerWidth < 800) {
    $('#searchBox').css("width", "80%");
}
if(window.innerWidth < 500) {
  $('#search').attr("placeholder", "Search");
}
$(window).resize(function(){
  var w = window.innerWidth;
    if(w < 800) {
        $('#searchBox').css("width", "80%");
    }
    if(w >= 800) {
        $('#searchBox').css("width", "50%");
    }
    if (w < 500) {
      $('#search').attr("placeholder", "Search");
    }
    if (w >= 500) {
      $('#search').attr("placeholder", "Dancing Queen, God's Plan...");
    }
});
