var bacon = require('baconjs'),
    split = require('split');

var rx = {
  bind: function(inputs, outputs, factory) {
    var inStreams = inputs.map(function(stream) {
      var lines = stream.pipe(split(/\r?\n/));
      return bacon.fromEventTarget(lines, 'data');
    });

    var outStreams = factory.apply(this, inStreams);

    outStreams.forEach(function(stream, i) {
      var write = function(value) {
        outputs[i].write(value + '\r\n');
      };
      stream.onValue(function(value) {
        if (value && typeof value.then === 'function')
          value.then(write);
        else
          write(value);
      });
    });
  },

  fromArray: function(values) {
    return bacon.sequentially(0, values);
  }
};

module.exports = rx;
