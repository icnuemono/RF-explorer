var serialport = require('serialport'),
    events = require('events');

var openPort = function(dev) {
  var SerialPort = serialport.SerialPort;

  // Open serial port on cmmm port with a 500k baudRate
  return new SerialPort(dev, {
    baudRate: 500000,
    // Call 'data' event with a 'line' of data whenever <EOL> (CRLF) is received.
    parser: serialport.parsers.readline('\r\n')
  });
};

var RequestCommands = {
  Current_Config: '#\x04C0'
};

var ReceivedCommands = {
  // #C2-M: <Main_Model>, <Expansion_Model>, <Firmware_Version> <EOL>
  Current_Setup: '#C2-M:',

  // #C2-F: <Start_Freq>, <Freq_Step>, <Amp_Top>, <Amp_Bottom>, <Sweep_Steps>,
  // <ExpModuleActive>, <CurrentMode>, <Min_Freq>, <Max_Freq>, <Max_Span>,
  // <RBW>, <AmpOffset>, <CalculatorMode> <EOL>
  Current_Config: '#C2-F:',

  // $S<Sample_Steps> <AdBm>... <AdBm> <EOL>
  Sweep_Data: '$S'
};

var text2ua = function(s) {
  var ua = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) {
    ua[i] = s.charCodeAt(i);
  }
  return ua;
};

var getEnumerable = function(hash, value) {
  var s = hash[value];
  if (!s) s = 'Unknown';
  return s;
};

var Modules = {
  0: '433M',
  1: '868M',
  2: '915M',
  3: 'WSUB1G',
  4: '2.4G',
  5: 'WSUB3G',
  6: '6G',
  255: 'None'
};

var Modes = {
  0: 'Spectrum Analyzer',
  1: 'RF Generator',
  2: 'Wi-Fi Analyzer'
};

var CalculatorModes = {
  0: 'Normal',
  1: 'Maximum',
  2: 'Average',
  3: 'Overwrite',
  4: 'Maximum Hold'
};

module.exports = {
  getCurrentConfig: function(tty, callback) {
    // Use the serial port specified by the third command line argument.
    var port = openPort(tty);

    // 'open' event - called when the serial port actually opens.
    port.on('open', function() {
      // console.log('Port opened.');
      port.write(RequestCommands.Current_Config);
    });

    // Event called whenever a line of data is received:
    port.on('data', function(data) {
      // console.log('Line received: ' + data);
      if (data.startsWith(ReceivedCommands.Current_Setup)) {
        // #C2-M:003,005,01.09
        if (typeof callback == 'function') callback({
          mainModel: data.substr(6, 3),
          expansionModel: data.substr(10, 3),
          firmwareVersion: data.substr(14, 5)
        });
        port.close();
      }
    });
  },

  // Returns an EventEmitter.
  connection: function(tty) {
    var emitter = new events.EventEmitter();

    var port = openPort(tty);
    port.on('open', function() {
      // Get the ball rolling:
      // port.write(RequestCommands.Current_Config);

      port.write('#\x20C2-F:5690000,5780000,0000,-118\r\n');
    });
    port.on('data', function(data) {
      if (data.startsWith(ReceivedCommands.Current_Setup)) {
        // setup: { mainModel: 006, expansionModel: 004, firmwareVersion: '01.12' }
        emitter.emit('setup', {
          mainModel: getEnumerable(Modules, Number(data.substr(6, 3))),
          expansionModel: getEnumerable(Modules, Number(data.substr(10, 3))),
          firmwareVersion: data.substr(14, 5)
        });
      }
      else if (data.startsWith(ReceivedCommands.Current_Config)) {
        // config: Current device settings (frequencies, top/bottom, etc.)

        // #C2-F: <Start_Freq>, <Freq_Step>, <Amp_Top>, <Amp_Bottom>, <Sweep_Steps>,
        // <ExpModuleActive>, <CurrentMode>, <Min_Freq>, <Max_Freq>, <Max_Span>,
        // <RBW>, <AmpOffset>, <CalculatorMode> <EOL>

        var values = data.substr(6).split(',');

        var startFrequency = values[0] * 1000,
            frequencyStep = values[1],
            sweepSteps = values[4],
            span = frequencyStep * sweepSteps;

        emitter.emit('config', {
          // Actual values from device:
          // Convert KHz to Hz for consistency everywhere.
          startFrequency: values[0] * 1000,
          frequencyStep: Number(values[1]),
          amplitudeTop: Number(values[2]),
          amplitudeBottom: Number(values[3]),
          sweepSteps: Number(values[4]),
          expansionModuleActive: Number(values[5]),
          currentMode: getEnumerable(Modes, values[6]),
          minimumFrequency: Number(values[7]) * 1000,
          maximumFrequency: Number(values[8]) * 1000,
          maximumSpan: Number(values[9]) * 1000,
          resolutionBandwidth: Number(values[10]) * 1000,
          amplitudeOffset: Number(values[11]),
          calculatorMode: getEnumerable(CalculatorModes, Number(values[12])),

          // Calculated values:
          span: frequencyStep * sweepSteps,
          endFrequency: startFrequency + span,
          centerFrequency: startFrequency + (span/2)
        });
      }
      else if (data.startsWith(ReceivedCommands.Sweep_Data)) { // && data[2] == 'p') {
        var count = data.charCodeAt(2);
        if (count != 112) {
          throw new Error('Did not receive 112 bytes.');
        }

        // data: array of actual dBm values
        var values = [];
        // Skip the $S and the count:
        for (var i=ReceivedCommands.Sweep_Data.length + 1; i<data.length; i++) {
          // As per docs for <Adbm>, value should be divided by two and negated
          // values.push(-data.charCodeAt(i)/2);
          values.push(-(data.charCodeAt(i) & 0xff)/2);
        }
        emitter.emit('data', values);
      }
    });
    return emitter;
  }
};
