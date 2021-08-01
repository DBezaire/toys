// var soundClasses = requires('./sound-synthesis');
var animationClasses = {};
var animations = {};
var checkboxes = {};

function setupTestAnimation(button) {
// initialize AudioContext (which requires user to have hit a button) and UI elements
  if (button.innerHTML == 'setup') {
    setupAnimations();
    // assume button's parent contains checkboxes and controls
    let parent = button.parentElement;
    makeCheckboxes(parent);
    parent.querySelector('ul.controls').style.display = 'block';
    button.innerHTML = 'play';
  } else {
    playAnimations();
  }
}

function setupAnimations() {
// Create an AudioContext and an instance of each
// of the sounds in soundClasses
// and store them in a global sounds object
//  let audioContext = new AudioContext();

  for (let a of Object.getOwnPropertyNames(animationClasses)) {
    animations[a] = new animationClasses[a](document.getElementById('cob'));
  }
  console.log('animations set up complete');
}

function makeCheckboxes(div) {
// add a UL to div with a checkbox for each
// sound the global sounds object
// and store the checkboxes in a global checkboxes object
  let ul = document.createElement('UL');
  ul.classList.add('checkboxes');
  for (let a in animations) {
    let li = document.createElement('LI');
    let label = document.createElement('label');
    label.setAttribute('for', a);
    label.innerHTML = a;
    let input = document.createElement('INPUT');
    input.setAttribute('id', a);
    input.setAttribute('type', 'checkbox');
    li.appendChild(label);
    li.appendChild(input);
    ul.appendChild(li);
    checkboxes[a] = input;
  }
  div.appendChild(ul);
  console.log('checkboxes set up complete');
}

function playAnimations() {
  animations.CircleOverBox.trigger();
  return;
// play checked animations
  let playingTimeSeconds = Number(document.querySelector("input#play-time").value);
  let beatLengthSeconds = Math.min(playingTimeSeconds, Number(document.querySelector("input#beat-length").value));
  let speed = Number(document.querySelector("input#speed").value);

  let beatsPerMeasure = 4;

  // count number checked and calculate
  // duration of each sound within a beat
  let numChecked = 0;
  for (let key in checkboxes) {
    if (checkboxes[key].checked) numChecked++
  }
  let duration = beatLengthSeconds/numChecked;

  // schedule the sounds within each beat to fill the playing time
  let nowTime = new Date(); // Math.ceil(sounds.Sound.context.currentTime);
  let beatCount = 0;
  for (let beatTime = 0; beatTime < playingTimeSeconds; beatTime += beatLengthSeconds) {
    beatCount++;
    let beatInMeasure = beatCount % beatsPerMeasure;
    let sequenceInBeat = 0;
    for (let key in animations) {
      if(checkboxes[key].checked) {
        animations[key].trigger(nowTime + beatTime + (sequenceInBeat * duration), beatInMeasure, speed, duration);
        sequenceInBeat++;
      }
    }
  }
}

animationClasses.Base = class {
// Class provides context, volume, and trigger().
// Also sets initial attack, decay, sustain, and release that usually get replaced by extensions.
// Extensions always replace shapeSound() and set equalizeFactor to balance against each other.

  constructor(container) {
    this.container = container;
    this.animationName = 'base class';
    this.duration = .05;

    // this.speed is set externally by the user in real time from 0 to 100 to adjust viewing level.
    // The value set here is just a starting point.
    // The speed is applied to all sounds from all subclasses.
    this.speed = 25;

    // this.equalizeFactor is set individually in each animation subclass to make them play roughly the same.
    // It is a multiplier, so the default value of 1 set here has no effect.
    this.equalizeFactor = 1;

    this.quietTimeAtStartSeconds = 0; // seconds of quiet before starting sound
    this.attackTime = .002; // seconds from zero to full volume
    this.decayTime = .002; // seconds from full volume to sustain volume
    this.sustainLevel = 1; // proportion of full volume held
    this.releaseTime = .002; // seconds from sustain volume to zero
    this.quietTimeAtEndProportion = .2; // proportion of duration silent at end
  }

  trigger(time, beatInMeasure = 1, speed = this.speed, duration = this.duration) {
    // if (typeof time == 'undefined') time = this.context.currentTime;
    this.calcSpeed = this.calculateSpeed(speed);
    this.calcDuration = duration;
    this.shapeAnimation(time, beatInMeasure);
  }

  shapeAnimation() {
    let item = {};
    this.setSettings(item, 0);
    alert('no shapeAnimation() defined');
  }

  calculateSpeed(speed) {
    return speed;
  }

  setSettings(item, time, params = null) {
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

    item.someSetting = 'some setting';

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

animationClasses.CircleOverBox = class extends animationClasses.Base {
  constructor(container) {
    super(container);
    this.animationName = 'CircleOverBox';
    this.equalizeFactor = .6;

    this.box = this.container.querySelector('.box');
    this.circle = this.container.querySelector('.circle');
  }

  shapeAnimation(time, beatInMeasure) {
    let boxX1 = this.box.offsetLeft;
    let boxY1 = this.box.offsetTop;
    let boxW = this.box.offsetWidth;
    let boxH = this.box.offsetHeight;
    let boxX2 = boxX1 + boxW;
    let boxY2 = boxY1 + boxH;
    let circleX1 = this.circle.offsetLeft;
    let circleY1 = this.circle.offsetTop;
    let circleW = this.circle.offsetWidth;
    let circleH = this.circle.offsetHeight;
    let circleX2 = circleX1 + circleW;
    let circleY2 = circleY1 + circleH;

    let circleXMin = boxX1;
    let circleYMin = boxY1;
    
    let circleXMax = boxX2 - circleW;
    let circleYMax = boxY2 - circleH;

    this.circle.style.left = circleXMax + 'px';
    this.circle.style.top = circleYMax + 'px';
    // alert(`this would be the ${this.animationName} process`);
  }
}

