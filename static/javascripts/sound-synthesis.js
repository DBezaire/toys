var soundClasses = {};
var sounds = {};
var checkboxes = {};

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

function setupTestSounds(button) {
// initialize AudioContext (which requires user to have hit a button) and UI elements
  if (button.innerHTML == 'setup') {
    setupSounds();
    // assume button's parent contains checkboxes and controls
    let parent = button.parentElement;
    makeCheckboxes(parent); 
    parent.querySelector('ul.controls').style.display = 'block';
    button.innerHTML = 'play';
  } else {
    playSounds();
  }
}

function setupSounds() {
// Create an AudioContext and an instance of each
// of the sounds in soundClasses
// and store them in a global sounds object
  let audioContext = new AudioContext();

  for (let s of Object.getOwnPropertyNames(soundClasses)) {
    sounds[s] = new soundClasses[s](audioContext);
  }
  console.log('sounds set up complete');
}

function makeCheckboxes(div) {
// add a UL to div with a checkbox for each 
// sound the global sounds object
// and store the checkboxes in a global checkboxes object
  let ul = document.createElement('UL');
  ul.classList.add('checkboxes');
  for (let s in sounds) {
    let li = document.createElement('LI');
    let label = document.createElement('label');
    label.setAttribute('for', s);
    label.innerHTML = s;
    let input = document.createElement('INPUT');
    input.setAttribute('id', s);
    input.setAttribute('type', 'checkbox');
    li.appendChild(label);
    li.appendChild(input);
    ul.appendChild(li);
    checkboxes[s] = input;
  }
  div.appendChild(ul);
  console.log('checkboxes set up complete');
}

function playSounds() {
// play checked sounds
  let playingTimeSeconds = Number(document.querySelector("input#play-time").value);
  let beatLengthSeconds = Math.min(playingTimeSeconds, Number(document.querySelector("input#beat-length").value));
  let volume = Number(document.querySelector("input#volume").value);
  
  let beatsPerMeasure = 4;
  
  // count number checked and calculate 
  // duration of each sound within a beat
  let numChecked = 0;
  for (let key in checkboxes) {
    if (checkboxes[key].checked) numChecked++
  }
  let duration = beatLengthSeconds/numChecked;

  // schedule the sounds within each beat to fill the playing time
  let nowTime = Math.ceil(sounds.Sound.context.currentTime);
  let beatCount = 0;
  for (let beatTime = 0; beatTime < playingTimeSeconds; beatTime += beatLengthSeconds) {
    beatCount++;
    let beatInMeasure = beatCount % beatsPerMeasure;
    let sequenceInBeat = 0;
    for (let key in sounds) {
      if(checkboxes[key].checked) {
        sounds[key].trigger(nowTime + beatTime + (sequenceInBeat * duration), beatInMeasure, volume, duration);
        sequenceInBeat++;
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
// Class provides context, volume, and trigger().
// Also sets initial attack, decay, sustain, and release that usually get replaced by extensions.
// Extensions always replace shapeSound() and set equalizeFactor to balance against each other.

  constructor(context) {
    this.soundName = 'base class';
    if(typeof this.context == 'undefined') this.context = context;
    this.duration = .05;
    
    // this.volume is set externally by the user in real time from 0 to 100 to adjust listening level.
    // The value set here is just a starting point.
    // The volume is applied to all sounds from all subclasses.
    this.volume = 25;
    
    // this.equalizeFactor is set individually in each sound subclass to make them sound roughly the same.
    // It is a multiplier, so the default value of 1 set here has no effect.
    this.equalizeFactor = 1;
    
    // The gain node rejects true zero, so add a tiny fraction across the board.
    this.gainNodeMinValue = 1.0e-15;
 
    this.quietTimeAtStartSeconds = 0; // seconds of quiet before starting sound
    this.attackTime = .002; // seconds from zero to full volume
    this.decayTime = .002; // seconds from full volume to sustain volume
    this.sustainLevel = 1; // proportion of full volume held
    this.releaseTime = .002; // seconds from sustain volume to zero
    this.quietTimeAtEndProportion = .2; // proportion of duration silent at end

    this.gain1 = this.context.createGain();
    this.gain1.connect(this.context.destination);
  }
  
  trigger(time, beatInMeasure = 1, volume = this.volume, duration = this.duration) {
    if (typeof time == 'undefined') time = this.context.currentTime;
    this.calcGain = this.calculateGain(volume);
    this.calcDuration = duration;
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

    // this.equalizeFactor gets set in each sound subclass.
      
    return ((10 ** (-2 * this.volumePower)) * (volume ** this.volumePower)) 
            * this.equalizeFactor 
            * this.volumeAdjust
            + this.gainNodeMinValue
    ;
  }

  setGain(node, time, params = null) {
  // implements a simplistic Attack, Decay, Sustain, Release envelope
    const paramOverride = (p) => (params !== null && params.hasOwnProperty(p)) ? params[p] : this[p];

    let quietTimeAtStartSeconds = paramOverride('quietTimeAtStartSeconds');
    let attackTime = paramOverride('attackTime');
    let decayTime = paramOverride('decayTime');
    let sustainLevel = paramOverride('sustainLevel');
    let releaseTime = paramOverride('releaseTime');
    let quietTimeAtEndProportion = paramOverride('quietTimeAtEndProportion');
    
    this.maxGain = (params !== null && params.hasOwnProperty('maxGain')) ? params['maxGain'] : this.calcGain;

    this.endBeat = time + this.calcDuration;
    this.endSound =  this.endBeat - (this.calcDuration * quietTimeAtEndProportion);
    this.endSustain = this.endSound - releaseTime;
    
    this.endSilence = time + quietTimeAtStartSeconds;
    this.endAttack = this.endSilence + attackTime;
    this.endDecay = Math.min(this.endSustain, this.endAttack + decayTime);
    
    this.sustainGain = this.maxGain * sustainLevel;
    
    node.setValueAtTime         (this.gainNodeMinValue , time      );
    node.setValueAtTime         (this.gainNodeMinValue , this.endSilence);
    node.linearRampToValueAtTime(this.maxGain          , this.endAttack );
    node.linearRampToValueAtTime(this.sustainGain      , this.endDecay  );
    node.setValueAtTime         (this.sustainGain      , this.endSustain);
    node.linearRampToValueAtTime(this.gainNodeMinValue , this.endSound  );
    
    console.log(` time:         ${time} - ${this.soundName}
                  endSilence:   ${this.endSilence}
                  endAttack:    ${this.endAttack}
                  endDecay:     ${this.endDecay}
                  endSustain:   ${this.endSustain}
                  endSound:     ${this.endSound}
                  endBeat:      ${this.endBeat}
                  calcGain:     ${this.calcGain}
                  maxGain:      ${this.maxGain}
                  sustainLevel: ${sustainLevel}
                  sustainGain:  ${this.sustainGain}
                `);
  }

}

soundClasses.Tone = class extends soundClasses.Sound {
  constructor(context) {
    super(context);
    this.soundName = 'Tone';
    this.equalizeFactor = .6;
  }
  
  shapeSound(time, beatInMeasure) {
    this.osc1 = this.context.createOscillator();
    this.osc1.connect(this.gain1);
    this.setGain(this.gain1.gain, time);
    
    this.osc1.start(time);
    this.osc1.stop(time + this.calcDuration);
  }
}

soundClasses.Snare = class extends soundClasses.Sound {
  constructor(context) {
    super(context);
    this.soundName = 'Snare';
    this.equalizeFactor = .7;
    
    this.whiteNoise = createWhiteNoise(this.context);
    
    this.hiPassFilter = this.context.createBiquadFilter();
    this.hiPassFilter.type = 'highpass';
    this.hiPassFilter.frequency.value = 1000;
    
    this.noiseGain = this.context.createGain();
    
    this.hiPassFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.context.destination);
    
    this.attackTime = .0005;
    this.decayTime = .05;
    this.sustainLevel = 0;
  }
  
  shapeSound(time, beatInMeasure) {
    let noise = this.context.createBufferSource();
    noise.connect(this.hiPassFilter);
    noise.buffer = this.whiteNoise;

    let osc = this.context.createOscillator();
    osc.connect(this.gain1);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, time);
    
    this.setGain(this.noiseGain.gain, time, {maxGain: this.calcGain * 0.4, decayTime: .18, sustainLevel: 0.08});
    
    this.setGain(this.gain1.gain, time);
    
    noise.start(time)
    noise.stop(time + this.calcDuration);
    osc.start(time)
    osc.stop(time + this.calcDuration);
  }
}

soundClasses.Kick = class extends soundClasses.Sound {
  constructor(context) {
    super(context);
    this.soundName = 'Kick';
    this.equalizeFactor = 5;
    
    // set very fast attack
    // and allow decay to continue to end of sound
    // finally reaching a sustain level of zero
    this.attackTime = .0005;
    this.decayTime = 2000; // set long; routine limits it to sustain time
    this.sustainLevel = 0; // proportion of full volume held
    this.quietTimeAtEndProportion = .8;
  }
  
  shapeSound(time, beatInMeasure) {
    let osc1 = this.context.createOscillator();
    osc1.connect(this.gain1);
    osc1.type = "triangle";
    osc1.frequency.value = 40;

    let osc2 = this.context.createOscillator();
    osc2.connect(this.gain1);
    osc2.type = "sine";
    osc2.frequency.value = 80;
    
    this.setGain(this.gain1.gain, time);
    
    osc1.frequency.setValueAtTime(120, this.endSilence);
    osc1.frequency.exponentialRampToValueAtTime(0.001, this.endSilence + .02);
    osc2.frequency.setValueAtTime(50, this.endSilence);
    osc2.frequency.exponentialRampToValueAtTime(0.001, this.endSilence + .02);
    
    osc1.start(time);
    osc1.stop(time + this.calcDuration);
    osc2.start(time);
    osc2.stop(time + this.calcDuration);
  }
}

soundClasses.Mtbeat = class extends soundClasses.Sound {
  constructor(context) {
    super (context);
    this.soundName = 'Mtbeat';
    this.equalizeFactor = 1;
    
    this.frequency1 = 1000;
    this.frequency2 = 800;
    
    this.quietTimeAtEndProportion = .95;
  }
  
  shapeSound(time, beatInMeasure) {
    let osc1 = this.context.createOscillator();
    osc1.connect(this.gain1);
    let freq = (beatInMeasure == 1) ? this.frequency1 : this.frequency2
    osc1.frequency.setValueAtTime(freq, time);
    
    this.setGain(this.gain1.gain, time);
    
    osc1.start(time);
    osc1.stop(time + this.calcDuration);
  }
}

soundClasses.Hihat = class extends soundClasses.Sound {
  constructor(context) {
    super (context);
    this.soundName = 'Hihat';
    this.equalizeFactor = 40;
    
    // sample obtained from https://github.com/chrislo/drum_synthesis/blob/gh-pages/samples/hihat.wav?raw=true';
    this.sampleUrl = './static/sounds/samples_hihat.wav';
    
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
    sound.connect(this.gain1);
    
    this.setGain(this.gain1.gain, time);

    sound.start(time);
    sound.stop(time + this.calcDuration);
  }
}

soundClasses.WhiteNoise  = class extends soundClasses.Sound {
  constructor(context) {
    super (context);
    this.soundName = 'WhiteNoise';
    this.equalizeFactor = 1;
    
    this.whiteNoiseBuffer = createWhiteNoise(this.context);
  }
  
  shapeSound(time, beatInMeasure) {
    let sound = this.context.createBufferSource();
    sound.buffer = this.whiteNoiseBuffer;
    sound.connect(this.gain1);
    
    this.setGain(this.gain1.gain, time);

    sound.start(time);
    sound.stop(time + this.calcDuration);
  }
}

soundClasses.DialTone = class extends soundClasses.Sound {
  constructor(context) {
    super(context);
    this.soundName = 'DialTone';
    this.equalizeFactor = .6;
    
    this.filter = this.context.createBiquadFilter();
    this.filter.connect(this.gain1);
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(8000, 0);    
  }
  
  shapeSound(time, beatInMeasure) {
    let osc1 = this.context.createOscillator();
    osc1.connect(this.filter);
    osc1.frequency.value = 350;
    
    let osc2 = this.context.createOscillator();
    osc2.connect(this.filter);
    osc2.frequency.value = 440;

    this.setGain(this.gain1.gain, time);
    
    osc1.start(time);
    osc1.stop(time + this.calcDuration);
  }
}
