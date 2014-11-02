var idGpx, idClock, options, template;

var state = {
  startedAt: null,
  stoppedAt: null,
  positions: []
};
 
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

idGpx = navigator.geolocation.watchPosition(success, error, options);
//navigator.geolocation.clearWatch(idGpx);

$('#start').click(function() {
  state.startedAt = new Date();
  state.stoppedAt = null;
  state.positions = [];
  
  idClock = setInterval(function() {
    var duration = (state.stoppedAt || new Date()) - state.startedAt - 3600000;

    $('#clock').text(moment(duration).format('HH:mm:ss'));
  }, 50);

  $('#start').hide();
  $('#stop').show();
  $('#stop').attr('href', '');
});

$('#stop').click(function(e) {
  var blob, file;

  state.stoppedAt = new Date();
  clearInterval(idClock);

  $('#stop').hide();
  $('#start').show();


  file = Mustache.render(template, state);
  //$('#gpx').text(file);
  //$('#gpx').show();

  if (typeof MozActivity !== 'undefined') {
    blob = new Blob([file], { type: 'application/gpx+xml' });
    new MozActivity({
      name: 'new', // Possibly compose-mail in future versions
      data: {
        type : 'mail',
        url: 'mailto:?subject=GPX',
        blobs: [blob],
        filenames: ['session.gpx']
      }
    });
    e.preventDefault();
  } else {
    blob = 'data:application/gpx+xml;base64,' + btoa(file);
    $(this).attr('href', blob)
  }
});
