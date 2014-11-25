$(function() {
  var idClock, options, template;

  var state = {
    startedAt: null,
    stoppedAt: null,
    positions: []
  };

  $('body').css('opacity', 1);
   
  $.get('gpx.mst', function(t) {
    template = t;
    Mustache.parse(template);
  });

  function updateStatus() {
    var accuracy;
    var n = state.positions.length;

    if (n == 0) {
      $('#status').html('Accuracy: none');
      $('#start').addClass('disabled');
    } else {
      accuracy = Math.round(state.positions[n - 1].accuracy);
      $('#status').html('Accuracy: ' + accuracy + ' m');
      $('#start').removeClass('disabled');

      if (accuracy > 50) {
        // TODO
      }
    }
  }

  function success(pos) {
    var position = {
      date: new Date(pos.timestamp).toISOString()
    };

    for (k in pos.coords) {
      position[k] = pos.coords[k] || 0;
    }
    state.positions.push(position)
    updateStatus();
  };

  function error(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
  };

  options = {
    enableHighAccuracy: true,
    maximumAge: 0
  };

  navigator.geolocation.watchPosition(success, error, options);

  $('#start').click(function() {
    $('#start').hide();
    $('#stop').show();
    $('#stop').attr('href', '');

    state.startedAt = new Date();
    state.stoppedAt = null;
    state.duration = 0;
    state.positions = [];
    
    idClock = setInterval(function() {
      var clock = moment.unix(++state.duration - 3600);
      $('#clock').text(clock.format('HH:mm:ss'));
    }, 1000);
  });

  $('#stop').click(function(e) {
    var blob, file;

    $('#stop').hide();
    $('#start').show();

    clearInterval(idClock);
    state.stoppedAt = new Date();
    file = Mustache.render(template, state);

    if (typeof MozActivity !== 'undefined') {
      e.preventDefault();
      blob = new Blob([file], { type: 'application/gpx+xml' });
      new MozActivity({
        name: 'new',
        data: {
          blobs: [blob],
          filenames: [$(this).attr('download')],
          type : 'mail',
          url: 'mailto:?subject=GeogTracker Export'
        }
      });
    } else {
      blob = 'data:application/gpx+xml;base64,' + btoa(file);
      $(this).attr('href', blob)
    }
  });
});
