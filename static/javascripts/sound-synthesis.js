//window.AudioContext = window.AudioContext || window.webkitAudioContext;
var checkboxes = {};
var soundClasses = {};
var audioContext = null;
var sounds = {};

function initSoundSynthesis() {
  // used for the test page sound-synthesis.html, 
  // but has no effect on the soundClasses or their 
  // use by other pages.
  
  // add checkboxes for each sound, label them,
  // and store them in an object
  let soundList = Object.getOwnPropertyNames(soundClasses);
  let div = document.getElementById('soundTest');
  for (s of soundList) {
    let label = document.createElement('label');
    label.setAttribute('for', s);
    label.innerHTML = s;
    let input = document.createElement('input');
    input.setAttribute('id', s);
    input.setAttribute('type', 'checkbox');
    div.appendChild(label);
    div.appendChild(input);
    checkboxes[s] = input;
  }
}

function playNoise() {
  // used for the test page sound-synthesis.html, 
  // but has no effect on the soundClasses or their 
  // use by other pages.
  
  // routine to create a white noise output
  // for exploration of concepts. 
  // Was trying to get to a 
  // re-usable buffer net of the highpass filter, but
  // never got there. Still, seems should be feasible?
  let audioContext = new AudioContext();
  
  var whiteNoise = createWhiteNoise(audioContext);
  var noise = audioContext.createBufferSource();
  noise.buffer = whiteNoise;
  noise.loop = true;
  
  var gain = audioContext.createGain();
  gain.gain.linearRampToValueAtTime(.02, 0);
  var filter = audioContext.createBiquadFilter();
  filter.frequency.setValueAtTime(1000, 0);
  filter.type = 'highpass';
  noise.connect(filter);
  filter.connect(gain);
  // filter.connect(audioContext.destination);
  gain.connect(audioContext.destination);
  noise.start(0);
  var filteredBuffer = noise.buffer.getChannelData(0);
  var unFilteredBuffer = whiteNoise.getChannelData(0);
  alert('reload page to stop noise');
}

function soundTest() {
  // used for the test page sound-synthesis.html, 
  // but has no effect on the soundClasses or their 
  // use by other pages.
  
  // runs all of the sounds in soundClasses
  // for which checkboxes are turned on 
  
  if (audioContext == null) {
    audioContext = new AudioContext();

    let soundList = Object.getOwnPropertyNames(soundClasses);
    for (s of soundList) {
      sounds[s] = new soundClasses[s](audioContext);
    }
  }
  
  let beatLength = 1; // seconds/beat
  let playingTime = 8; // seconds
  let beatCount = 0;
  let beatsPerMeasure = 4;
  let nowTime = audioContext.currentTime + beatLength;
  
  let numChecked = 0;
  for (let key in checkboxes) {
    if (checkboxes[key].checked) numChecked++
  }
  
  for (let beatTime = 0; beatTime < playingTime; beatTime += beatLength) {
    beatCount++;
    let beatInMeasure = beatCount % beatsPerMeasure;
    let c = 0;
    for (let key in sounds) {
      if(checkboxes[key].checked) {
        sounds[key].trigger(nowTime + beatTime + (c * beatLength/numChecked), beatInMeasure);
        c++;
      }
    }
  } 
}

function createWhiteNoise(context) {
  // creates buffer of random values between -1 and 1
  var bufferSize = context.sampleRate;
  var buffer = context.createBuffer(1, bufferSize, bufferSize);
  var output = buffer.getChannelData(0);

  for (var i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function loadSample(url, context, callback) {
  fetch(url)
    .then(response => {console.log(response); return response.arrayBuffer();})
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
    .then(buffer => callback(buffer))
    .catch(error => {console.error('Fetch error', error);})
  ;
}

soundClasses.Sound = class {
// Class provides context, duration, volume, and trigger().
// Extensions replace shapeSound() and set equalizeFactor to balance against each other.
  constructor(context) {
    this.context = context;
    this.duration = .05;
    
    // this.volume is set externally by the user in real time from 0 to 100 to adjust listening level.
    // The value set here is just a starting point.
    // The volume is applied to all sounds from all subclasses.
    this.volume = 25;
    
    // this.equalizeFactor is set individually in each sound subclass to make them sound roughly the same.
    // It is a multiplier, so the default value of 1 set here has no effect.
    this.equalizeFactor = 1;
  }
  
  trigger(time, beatInMeasure = 1, volume = this.volume) {
    if (typeof time == 'undefined') time = this.context.currentTime;
    this.calculateGain(volume);
    this.shapeSound(time, beatInMeasure);
  }
  
  shapeSound() {
    alert('no shapeSound() defined');
  }
  
  calculateGain(volume) {
  // Converts a linear volume value between 0 and 100 into a gain value between 0 and 1.

  // Theoretical goal is to generate output from the shapeSound() routines that varies from zero to 1.
  // This is then multiplied by a gain ranging from zero to 1 calculated through this function 
  // to attenuate (reduce) the signal. This is to avoid potential clipping which supposedly happens
  // in some browsers when output values exceed 1.
  // See discussion in https://teropa.info/blog/2016/08/30/amplitude-and-loudness.html.

  // However, reality perceived by listening to several computers, speakers, and/or browsers might show
  // that the overall outputs are too low or too high. Therefore, this.volumeAdjust can be set here.
  // It is a multiplier, so a value of 1 has no effect.
  // It is applied to all sounds from all subclasses.
  this.volumeAdjust = 1;
  
  // Attempt to give the user greater volume control at the low end by an exponential function.
  // Tried to use https://elsenaju.eu/Calculator/online-curve-fit.htm to find coefficients 
  // using points (0,0), (5,.005), (60,.35), (100,1). It produced odd results which in turned
  // made me realize by inspection that 100 squared times .0001 gets me the 1 that I want.
  // Thus, and after playing in Excel a bit (./unused/sound-synthesis/volume-calculations.xlsx),
  // it becomes y = (10 ^ (-2 * power)) * (x ^ power) with power varying from about 1 to 3 
  // to give various sensitivity curves. In the end, doesn't seem to have all that much effect.
  this.volumePower = 2;

  // The gain node rejects true zero, so add a tiny fraction across the board.
  const gainNodeMinValue = 1.0e-15;
  
  // this.equalizeFactor gets set in each sound subclass.
    
  this.calcGain = ((10 ** (-2 * this.volumePower)) * (volume ** this.volumePower)) 
                  * this.equalizeFactor 
                  * this.volumeAdjust
                  + gainNodeMinValue
  ;
  }
}

soundClasses.Tone = class extends soundClasses.Sound {
  constructor(context) {
    super(context);
    this.equalizeFactor = .6; // ranges 0 to 5 or more; adjust for each sound to balance them with each other
    
    this.gain1 = this.context.createGain();
    this.gain1.connect(this.context.destination);
  }
  shapeSound(time, beatInMeasure) {
    this.osc1 = this.context.createOscillator();
    this.osc1.connect(this.gain1);
    this.gain1.gain.exponentialRampToValueAtTime(this.calcGain, time);
    
    this.osc1.start(time);
    this.osc1.stop(time + this.duration);
  }
}

soundClasses.Snare = class extends soundClasses.Sound{
  constructor(context) {
    super(context);
    this.equalizeFactor = .7; // ranges 0 to 5 or more; adjust for each sound to balance them with each other

    this.whiteNoise = createWhiteNoise(this.context);
    
    this.hiPassFilter = this.context.createBiquadFilter();
    this.hiPassFilter.type = 'highpass';
    this.hiPassFilter.frequency.value = 1000;
    
    this.noiseGain = this.context.createGain();
    
    this.hiPassFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.context.destination);
    
    this.oscGain = this.context.createGain();
    this.oscGain.connect(this.context.destination);
  }
  
  shapeSound(time, beatInMeasure) {
    this.noise = this.context.createBufferSource();
    this.noise.buffer = this.whiteNoise;
    this.noise.connect(this.hiPassFilter);
    
    this.noiseGain.gain.setValueAtTime(this.calcGain, time);
    this.noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    this.noise.start(time)
    this.noise.stop(time + 0.2);

    this.osc = this.context.createOscillator();
    this.osc.type = 'triangle';
    this.osc.connect(this.oscGain);
    
    this.osc.frequency.setValueAtTime(100, time);
    this.oscGain.gain.setValueAtTime(0.8 * this.calcGain, time); // 0.8 balances hit sound to noise
    this.oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    this.osc.start(time)
    this.osc.stop(time + 0.2);
  }
}

soundClasses.Kick = class extends soundClasses.Sound {
  constructor(context) {
    super(context);
    this.equalizeFactor = 5; // ranges 0 to 5 or more; adjust for each sound to balance them with each other

    this.gain1 = this.context.createGain();
    this.gain2 = this.context.createGain();
    this.gain1.connect(this.context.destination);
    this.gain2.connect(this.context.destination);
  }
  
  shapeSound(time, beatInMeasure) {
    this.osc1 = this.context.createOscillator();
    this.osc1.connect(this.gain1);
    this.osc1.type = "triangle";
    this.osc1.frequency.value = 40;
    
    this.osc1.frequency.setValueAtTime(120, time);
    this.osc1.frequency.exponentialRampToValueAtTime(0.001, time + 0.5);
    this.gain1.gain.setValueAtTime(this.calcGain, time);
    this.gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    
    this.osc1.start(time);
    this.osc1.stop(time + this.duration);
    
    this.osc2 = this.context.createOscillator();
    this.osc2.connect(this.gain2);
    this.osc2.type = "sine";
    this.osc2.frequency.value = 80;
    
    this.osc2.frequency.setValueAtTime(50, time);
    this.osc2.frequency.exponentialRampToValueAtTime(0.001, time + 0.5);
    this.gain2.gain.setValueAtTime(this.calcGain, time);
    this.gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    
    this.osc2.start(time);
    this.osc2.stop(time + this.duration);
  }
}

soundClasses.Mtbeat = class extends soundClasses.Sound {
  constructor(context) {
    super (context);
    this.equalizeFactor = 1;  // ranges 0 to 5 or more; adjust for each sound to balance them with each other
    
    this.frequency1 = 1000;
    this.frequency2 = 800;
    
    this.gain1 = this.context.createGain();
    this.gain1.connect(this.context.destination);
  }
  
  shapeSound(time, beatInMeasure) {
    this.osc1 = this.context.createOscillator();
    this.osc1.connect(this.gain1);
    let freq = (beatInMeasure == 1) ? this.frequency1 : this.frequency2
    this.osc1.frequency.setValueAtTime(freq, time);
    
    this.gain1.gain.setValueAtTime(0.0000000000000001, time);
    this.gain1.gain.exponentialRampToValueAtTime(this.calcGain, time + 0.001);
    this.gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    
    this.osc1.start(time);
    this.osc1.stop(time + this.duration);
  }
}

soundClasses.Hihat = class extends soundClasses.Sound {
  constructor(context) {
    super (context);
    this.equalizeFactor = 40;  // ranges 0 to 5 or more; adjust for each sound to balance them with each other
    
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
    
    // this.sampleUrl = 'https://pure-ocean-69938.herokuapp.com/https://github.com/chrislo/drum_synthesis/blob/gh-pages/samples/hihat.wav?raw=true';
   // this.sampleUrl = 'https://toys-dlb.herokuapp.com/static/sounds/samples_hihat.wav';
    this.sampleUrl = './static/sounds/samples_hihat.wav';
    // this.sampleUrl = 'https://localhost:4000/static/sounds/samples_hihat.wav';
    
    this.sampleBuffer = 'nothing';
    loadSample(this.sampleUrl, this.context, buffer => this.sampleBuffer = buffer); 
  }
  
  shapeSound(time, beatInMeasure) {
    if (typeof this.sampleBuffer == 'string' && this.sampleBuffer.length < 20) {
      alert(`sampleBuffer contains ${this.sampleBuffer}`);
      return;
    }
    let sound = this.context.createBufferSource();
    sound.buffer = this.sampleBuffer;
    sound.connect(this.gain);
    
    this.gain.gain.setValueAtTime(this.calcGain, time);
    this.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    sound.start(time);
    sound.stop(time + this.duration);
  }
}

soundClasses.WhiteNoise  = class extends soundClasses.Sound {
  constructor(context) {
    super (context);
    this.equalizeFactor = 1;  // ranges 0 to 5 or more; adjust for each sound to balance them with each other
    
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);

    this.whiteNoiseBuffer = createWhiteNoise(audioContext);
  }
  
  shapeSound(time, beatInMeasure) {
    let sound = this.context.createBufferSource();
    sound.buffer = this.whiteNoiseBuffer;
    sound.connect(this.gain);
    
    this.gain.gain.setValueAtTime(this.calcGain, time);
    this.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    sound.start(time);
    sound.stop(time + this.duration);
  }
}
