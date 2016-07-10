// jshint esversion: 6

const bands = {
  A: {
    name: 'Boscam A',
    channels: {
      1: 5865,
      2: 5845,
      3: 5825,
      4: 5805,
      5: 5785,
      6: 5765,
      7: 5745,
      8: 5725,
    }
  },
  B: {
    name: 'Boscam B',
    channels: {
      1: 5733,
      2: 5752,
      3: 5771,
      4: 5790,
      5: 5809,
      6: 5828,
      7: 5847,
      8: 5866,
    }
  },
  E: {
    name: 'Lumenier / DJI',
    channels: {
      1: 5705,
      2: 5685,
      3: 5665,
      4: 5645,
      5: 5885,
      6: 5905,
      7: 5925,
      8: 5945,
    }
  },
  F: {
    name: 'Fatshark / ImmersionRC / Airwave',
    channels: {
      1: 5740,
      2: 5760,
      3: 5780,
      4: 5800,
      5: 5820,
      6: 5840,
      7: 5860,
      8: 5880,
    }
  },
  R: {
    name: 'Raceband',
    channels: {
      1: 5658,
      2: 5695,
      3: 5732,
      4: 5769,
      5: 5806,
      6: 5843,
      7: 5880,
      8: 5917,
    }
  }
};


// All FPV video frequencies, specifically the 5.8GHz ISM band:
module.exports = {
  bands,

};
