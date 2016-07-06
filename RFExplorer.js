// jshint esversion: 6

var _ = require('underscore'),
    serialport = require('serialport'),
    events = require('events'),
    frequencies = require('./frequencies.js');

var openPort = (device) => {
  var SerialPort = serialport.SerialPort;

  // Open serial port on cmmm port with a 500k baudRate
  return new SerialPort(device, {
    baudRate: 500000,
    // Call 'data' event with a 'line' of data whenever <EOL> (CRLF) is received.
    parser: serialport.parsers.byteDelimiter([0x0d, 0x0a])
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

var text2ua = (s) => {
  var ua = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) {
    ua[i] = s.charCodeAt(i);
  }
  return ua;
};

var ua2text = (ua) => {
  var s = '';
  for (var i = 0; i < ua.length; i++) {
    s += String.fromCharCode(ua[i]);
  }
  return s;
};

var getEnumerable = (hash, value) => {
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
  60: 'RFGen',
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

var Parsers = {
  "Current_Setup": (text) => {
    // setup: { mainModel: 006, expansionModel: 004, firmwareVersion: '01.12' }

    return {
      mainModel: getEnumerable(Modules, Number(text.substr(6, 3))),
      expansionModel: getEnumerable(Modules, Number(text.substr(10, 3))),
      firmwareVersion: text.substr(14, 5)
    };
  },

  "Current_Config": (text) => {
    // config: Current device settings (frequencies, top/bottom, etc.)

    // #C2-F: <Start_Freq>, <Freq_Step>, <Amp_Top>, <Amp_Bottom>, <Sweep_Steps>,
    // <ExpModuleActive>, <CurrentMode>, <Min_Freq>, <Max_Freq>, <Max_Span>,
    // <RBW>, <AmpOffset>, <CalculatorMode> <EOL>

    var values = text.substr(6).split(',');

    var startFrequency = values[0] * 1000,
        frequencyStep = values[1],
        sweepSteps = values[4],
        span = frequencyStep * sweepSteps;

    return {
      // Actual values from device:
      // Convert KHz to Hz for consistency everywhere.
      startFrequency: values[0] * 1000,
      frequencyStep: Number(values[1]),
      amplitudeTop: Number(values[2]),
      amplitudeBottom: Number(values[3]),
      sweepSteps: Number(values[4]),
      expansionModuleActive: Number(values[5]),
      currentMode: getEnumerable(Modes, values[6]),
      moduleMinimumFrequency: Number(values[7]) * 1000,
      moduleMaximumFrequency: Number(values[8]) * 1000,
      moduleMaximumSpan: Number(values[9]) * 1000,
      resolutionBandwidth: Number(values[10]) * 1000,
      amplitudeOffset: Number(values[11]),
      calculatorMode: getEnumerable(CalculatorModes, Number(values[12])),

      // Calculated values:
      span: frequencyStep * sweepSteps,
      endFrequency: startFrequency + span,
      centerFrequency: startFrequency + (span / 2)
    };
  },

  "Sweep_Data": (raw, emitter) => {
    var count = raw[2];
    if (count != 112) {
      throw new Error('Did not receive 112 bytes.');
    }

    var values = [];

    // Skip the $S and the count:
    for (var i = ReceivedCommands.Sweep_Data.length + 1; i < raw.length; i++) {
      // As per docs for <Adbm>, value should be divided by two and negated
      // values.push(-data.charCodeAt(i)/2);
      values.push(Number(raw[i]) / -2.0);
    }

    return values;
  }
};

module.exports = {
  // Returns an EventEmitter.
  connection: (tty) => {
    var emitter = new events.EventEmitter();

    var port = openPort(tty);

    port.on('open', () => {
      // Get the ball rolling:
      // port.write('#\x03R');
      port.write(RequestCommands.Current_Config);
      // port.write('#\x20C2-F:5000000,5085000,0000,-118\r\n');
      // port.write('#\x05CM1');
    });

    port.on('data', (raw) => {
      raw = raw.slice(0, -2);
      text = ua2text(raw);

      // console.log(text);

      if (text.startsWith(ReceivedCommands.Current_Setup)) {
        emitter.emit('setup', Parsers.Current_Setup(text));
      }
      else if (text.startsWith(ReceivedCommands.Current_Config)) {
        emitter.emit('config', Parsers.Current_Config(text));
      }
      else if (text.startsWith(ReceivedCommands.Sweep_Data)) {
        emitter.emit('data', Parsers.Sweep_Data(raw));
      }
    });

    return emitter;
  }
};
