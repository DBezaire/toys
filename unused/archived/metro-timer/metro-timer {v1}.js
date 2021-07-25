/** MetroTimer        --------------------------------------------------------------
 *  Based on GIT referenced in https://grantjam.es/creating-a-simple-metronome-using-javascript-and-the-web-audio-api
 */
class MetroTimer {
  constructor(tempo = 0) {
    // params that typically get can be updated while running
    this.tempo = tempo;
    this.volume = 25;
    this.countLimit = null;
    this.timeLimit = null;
    this.beatsPerMeasure = 4;
    this.beatType = 'block';
    
    // params set at instantiation and remain static
    this.reportCountElement;
    this.reportTimeElement;
    
    // params set only here in constructor
    this.lookahead = 25;          // How frequently to call scheduling function (in milliseconds)
    this.scheduleAheadTime = 0.1;   // How far ahead to schedule audio (sec)
    
    this.minimumTempo = 6; // keeps metronome from running with over 10 seconds between beats
    this.beatDuration = .03;
    this.frequency1 = 1000;
    this.frequency2 = 800;
    
    // for greater volume control sensitivity at low end, uses
    // power function y = a * x ^ b
    // Here it is calcGain = volumeFactor * volume ^ volumePower 
    // where:
    //  - calcGain should range from 0 to 3.4 per the AudioContext spec
    //  - volume is set from 0 to 100 on the slider control.
    // Used https://mycurvefit.com/ to obtain factors
    // fitting points (0,0), (5,.004), (60,.7), (100,3.4)
    // results can be seen by setting this.showCalcGain to true
    this.volumeFactor = 2.206524e-6; //1.387365e-5; 
    this.volumePower = 3.093885; // 2.69734;
    
    // process variables that need to be initialized only once per instantiation
    this.audioContext = null;
  }

  playOneBeat(beatTime) {
    // set volume on to produce sound then off to silence at end of beat 
    // use exponential function to calculate gain for greater resolution at low end
    // exponential ramp parameters give the beat a certain timbre
    let calcGain = .001 + this.volumeFactor * (this.volume ** this.volumePower);
    
    // start dead quiet
    this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.000000000000001, beatTime);
    
    
    // shape the sound
    let freq;
    let decayTime;
    switch (this.beatType) {
      case 'block':
        // set frequency based on beat number within measure
        freq = (this.beatCount % this.beatsPerMeasure == 1) ? this.frequency1 : this.frequency2
        this.oscillator.frequency.setValueAtTime(freq, beatTime);
        this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(calcGain, beatTime + 0.001);
        this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.02);
        break;
      case 'kick':
        freq = 100;
        decayTime = .5;
        this.oscillator.frequency.setValueAtTime(freq, beatTime + .001);
        this.oscillatorEnvelope.gain.linearRampToValueAtTime(calcGain, beatTime + 0.001);
        this.oscillator.frequency.exponentialRampToValueAtTime(1, beatTime + decayTime);
        this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(.01 * calcGain, beatTime + decayTime);
        this.oscillatorEnvelope.gain.linearRampToValueAtTime(.01 * calcGain, beatTime + decayTime + 0.1);
        
        break;
    }
    
    // finish dead quiet
    this.oscillatorEnvelope.gain.exponentialRampToValueAtTime(0.000000000000001, beatTime + this.beatDuration);

    // advance the beat counter
    this.beatCount++;
  }

  scheduler() {
    // This function is run frequently... about 40 times per second.
    
    // It looks ahead, checking this.nextBeatTime to see if the next beat occurs before it will run again.
    // Any beats needed before the next time it runs get played, with the nextBeatTime updated each time.
    
    // This function also updates the time and counter displays.
    
    if (this.tempo < this.minimumTempo) {
      this.reportCountElement.innerHTML = 'Timer only';
    } else {
      while (this.nextBeatTime < this.audioContext.currentTime + this.scheduleAheadTime ) {
        this.playOneBeat(this.nextBeatTime);
        this.showElapsedOrRemaining(this.beatCount, 1, this.countLimit, this.reportCountElement);
        this.nextBeatTime += 60.0 / this.tempo; // Notice this picks up the CURRENT tempo value to calculate beat length.
      }
    }
    
    this.showElapsedOrRemaining(this.audioContext.currentTime, this.startTime, this.timeLimit, this.reportTimeElement, secs2MinsSecs);
  }
  
  showElapsedOrRemaining(current, start, limit, elem, format = (a) => a) {
    if (limit == null) {
      let elapsed = Math.round(current - start);
      if(elapsed >= 1) elem.innerHTML = format(elapsed);
    } else {
      let remaining = Math.max(0, Math.round(start + limit - current));
      elem.innerHTML = 'remaining: ' + format(remaining);
      if (remaining < 1) this.stop();
    }
  }  

  start() {
    if (this.isRunning) return;

    if (this.audioContext == null) {
      // Create the AudioContext and oscillator.
      // Although this is done only once per instantiation, browser privacy options 
      // are avoided by waiting until user has clicked something. 
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.oscillator = this.audioContext.createOscillator();
      this.oscillatorEnvelope = this.audioContext.createGain();
      this.oscillator.connect(this.oscillatorEnvelope);
      this.oscillatorEnvelope.connect(this.audioContext.destination);
      this.oscillatorEnvelope.gain.value = .001;
      this.oscillator.start();
    }

    this.nextBeatTime = this.audioContext.currentTime; + 0.05;
    
    this.startTime = this.nextBeatTime;
    
    this.beatCount = 0;
    this.startCount = 1;

    this.isRunning = true;
    this.intervalID = setInterval(() => this.scheduler(), this.lookahead);
    this.startStopButton.setLabel(1);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.intervalID);
    this.startStopButton.setLabel(0);
  }

  toggleStartStop() {
    if (this.isRunning) {
        this.stop();
    } else {
        this.start();
    }
  }
}

/** Slider       ---------------------------------------------------------------------
 *
 */
class Slider {
  constructor (div) {
    this.id = div.id;
    this.slider = div.getElementsByTagName('input')[0];
    
    let spans = div.getElementsByTagName('span');
    this.titleSpan = spans[0];
    this.valueSpan = spans[1];
    this.reportSpan = spans[2];
    
    this.slider.addEventListener('input', () => {this.sliderChange();});
    
    this.min = this.slider.min;
    this.max = this.slider.max;
    this.range = this.max - this.min;

    this.thumbWidth = 18; /* this width matches that entered in CSS */
    this.sliderWidth = this.slider.offsetWidth; // - this.thumbWidth;
    this.sliderLeft = this.slider.offsetLeft;
    this.sliderRight = this.sliderLeft + this.sliderWidth;
    
    if (div.classList.contains('stepper')) {
      div.appendChild(this.makeSteppers(div.dataset.stepperSizes.split(',')));
    }
      
  }
  
  showValue() {
    this.valueSpan.innerHTML = this.formatValue();
    this.reportSpan.innerHTML = "";
  }

  sliderChange() {
    this.showValue();
    this.changedValue();
  }
  
  changedValue() {
    // A unique function must be added to each slider object that
    // reflects the new value into other systems (i.e. MetroTimer). 
    // This default simply alerts the new value.
    alert(
`The ${this.id} slider has been changed to value ${this.slider.value}.

Note that this will affect nothing until the default "changedValue()" function is replaced by one specific to the ${this.id} slider.`
    ); 
  }
  
  formatValue() {
    // A unique function must be added to each slider object that
    // formats the value for reporting. 
    // This default simply returns value.
    return `${this.slider.value} (unformatted)`;
  }

  makeSteppers(stepSizes) {
    // returns buttons within a container
    // const stepSizes = [1, 20, 30];
    const container = document.createElement('DIV');
    container.classList.add('steppers');
    for (let n = 0; n < stepSizes.length; n++) {
      const dv = document.createElement('DIV');
      const btn = document.createElement('INPUT');
      const span = document.createElement('SPAN');
      setAttributes(btn, {'type': 'radio', 'name': this.id + 'StepSize', 'value': stepSizes[n]});
      if (n == 1) {
        this.slider.step = stepSizes[n];
        btn.checked = true;
      }
      span.innerHTML = `Step: ${stepSizes[n]}`;
      btn.addEventListener('click', () => {this.slider.step = stepSizes[n]; this.sliderChange(); this.positionNudges();});
      dv.appendChild(btn);
      dv.appendChild(span);
      container.appendChild(dv);
    }
    return container;
  }

}

/** NudgeSlider        --------------------------------------------------------------
 *
 */
class NudgeSlider extends Slider {
  constructor(div) {
    super(div);
    
    // create svg left- and right-pointing arrows
    this.downNudge = this.makeNudge(0);
    this.upNudge = this.makeNudge(1);
    
    // insert them before and after the slider
    div.insertBefore(this.downNudge, this.slider);
    div.insertBefore(this.upNudge, this.slider.nextSibling);
    
    // add click handlers to each nudge
    this.downNudge.addEventListener('click', () => {this.slider.stepDown(); this.positionNudges(); this.sliderChange();});
    this.upNudge.addEventListener('click', () => {this.slider.stepUp(); this.positionNudges(); this.sliderChange();});
    
    // add handler so nudges get positioned when slider is changed directly
    this.slider.addEventListener('input', () => {this.positionNudges();});
    
    // add handler to surrounding div to show the nudges on hover
    div.addEventListener('mouseover', () => {this.showHideNudges();});
    div.addEventListener('mouseout', () => {this.showHideNudges();});
    
    // pick up the width that is set in CSS
    this.nudgeWidth = this.downNudge.clientWidth;
    
    // put them in initial positions
    this.positionNudges();
  }
    
  positionNudges() {
    // move each nudge along the slider based on proportional value
    // but hide the appropriate nudge when slider is at min or max
    if (this.slider.value == this.min) {
      this.downNudge.style.display = 'none';
    } else {
      this.downNudge.style.display = 'block';
      let x = (this.sliderWidth - this.thumbWidth) * (this.slider.value / this.range);
      this.downNudge.style.left = this.sliderLeft - this.nudgeWidth + x + 'px';
    }
    if (this.slider.value == this.max) {
      this.upNudge.style.display = 'none';
    } else {
      this.upNudge.style.display = 'block';
      let x = (this.sliderWidth - this.thumbWidth) * (1 -(this.slider.value / this.range));
      this.upNudge.style.left = this.sliderRight - x + 'px';
    }
  }
  
  showHideNudges() {
    this.downNudge.classList.toggle('opacity-toggle');
    this.upNudge.classList.toggle('opacity-toggle');
  }
  
  makeNudge(which) {
    // returns svg element with specified path.
    // these paths define left- and right-pointing arrows.
    const paths = [
      "M 12 0 L 0 6 L 12 12 C 6 6 6 6 12 0",
      "M 0 0 L 12 6 L 0 12 C 6 6 6 6 0 0"
    ];
    const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    svg.classList.add('arrow');
    const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    path.setAttribute('d', paths[which]);
    svg.appendChild(path);
    return svg;
  }
}

/** Button       ---------------------------------------------------------------------
 *
 */
class Button {
  constructor(elem) {
    this.name = elem.getAttribute('name');
    
    this.labels = [];
    if (elem.classList.contains('toggle')) {
      this.labels = this.name.split('/');
      this.isToggle = true;
    } else {
      this.labels[0] = this.name;
      this.isToggle = false;
    }
    this.labelNow = 0;
    this.elem = elem;
    
    this.showLabel();
    
    this.elem.addEventListener('click', () => {this.handleClick();});
  }
  
  setLabel(index) {
    this.labelNow = index;
    this.showLabel();
  }
  
  showLabel() {
    this.elem.innerHTML = this.labels[this.labelNow];
  }
  
  toggleLabel() {
    this.labelNow = this.labelNow == 0 ? 1 : 0;
    this.showLabel();
  }
  
  handleClick() {
    // A unique function must be added to each button object that
    // reflects the new value into other systems (i.e. MetroTimer). 
    // This default simply alerts the click.
    alert(
`The ${this.name} button was clicked.

Note that this will affect nothing until the default "handleClick()" function is replaced by one specific to the ${this.name} button.`
    ); 
  }
}

/** Dice       -----------------------------------------------------------------------
 *
 */
class Dice {
  constructor(para) {
    this.para = para;
    this.span = para.getElementsByTagName('span')[0];
    this.inputs = para.getElementsByTagName('input');
    this.button = para.getElementsByTagName('button')[0];
    this.div = para.getElementsByTagName('div')[0];
    this.numDice = this.inputs[0].value;
    this.numSides = this.inputs[1].value;
    this.button.addEventListener('click', () => this.roll(this));
    this.inputs[0].addEventListener('change', () => {this.numDice = this.inputs[0].value;});
    this.inputs[1].addEventListener('change', () => {this.numSides = this.inputs[1].value;});
    this.dieElements = [];
  }
  
  roll() {
    this.dieElements.forEach((e) => e.remove());
    let total = 0;
    for (let i = 0; i < this.numDice; i++) {
      let r = getRandomIntInclusive(1, this.numSides);
      let die = this.drawDie(r);
      this.div.appendChild(die, this.dieElement);
      this.dieElements.push(die);
      total += r;
    }
    if (this.numDice > 1) {
      this.span.innerHTML = total;
      this.span.style.display = 'inline-block';
    } else {
      this.span.style.display = 'none';
    }
  }

  drawDie(dots) {
    const dotSpecs = [
      // position of each dot on a 3x3 grid
      // empty elements in the zero positions to permit access by dot-number
      [],
      [[], [2,2]],
      [[], [1,1], [3,3]],
      [[], [1,1], [2,2], [3,3]],
      [[], [1,1], [3,1], [3,3], [1,3]],
      [[], [1,1], [3,1], [2,2], [3,3], [1,3]],
      [[], [1,1], [1,2], [1,3], [3,1], [3,2], [3,3]],
      [[], [1,1], [1,2], [1,3], [2,2], [3,1], [3,2], [3,3]],
      [[], [1,1], [1,2], [1,3], [2,1], [2,3], [3,1], [3,2], [3,3]],
      [[], [1,1], [1,2], [1,3], [2,1], [2,2], [2,3], [3,1], [3,2], [3,3]],
    ];
/*
                         1  1  1  1  1  2  2  2  2  2  3
          0  2  4  6  8  0  2  4  6  8  0  2  4  6  8  0
          abcdefgh
          ijklmnop
          q r s t
           u v w x
                    1 1 1 1 1 2 2 2 2 2 3 3 3
          1 3 5 7 9 1 3 5 7 9 1 3 5 7 9 1 3 5 
          ---------------------------------
          .|||   |||||   |||||   |||||   |||. 
            3      1       1       2      3
                   0       8       6      3
                   
          viewport goes from before 1 to after 35, i.e., 0, 0, 36, 36
          but gets expanded down for the text digit, so 0, 0, 36, 56
          
          rect goes from 3 to 33, so 30 x 30
          
          dot centers are 10, 18, 26; each 8 greater than prior
          
          text positioning below die done by trial-and-error

*/
    const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    svg.setAttribute('viewBox', "0, 0, 36, 56");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    setAttributes(rect, {'width': '30', 'height': '30', 'x': '3', 'y': '3'});
    svg.appendChild(rect);
    const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
    setAttributes(text, {'x': '15', 'y': '48'});
    text.innerHTML = '' + dots;
    svg.appendChild(text);
    for (let d = 1; d <= dots; d++) {
      let x = '' + (10 + (dotSpecs[dots][d][0] - 1) * 8);
      let y = '' + (10 + (dotSpecs[dots][d][1] - 1) * 8);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
      setAttributes(dot, {'cx': x, 'cy': y}); 
      svg.appendChild(dot);
    }
    return svg;
  }
}

/** Cards       ----------------------------------------------------------------------
 * Copied from https://wsvincent.com/javascript-object-oriented-deck-cards/
 */
class Cards{
  constructor(){
    // this.cards = [];
    this.reset();
    this.shuffle();
  }

  reset(){
    this.cards = [];

    const suits = ['Hearts', 'Spades', 'Clubs', 'Diamonds'];
    const values = ['Ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Jack', 'Queen', 'King'];

    for (let suit in suits) {
      for (let value in values) {
        this.cards.push(`${values[value]} of ${suits[suit]}`);
      }
    }
  }

  shuffle(){
    const { cards } = this;
    let m = cards.length, i;

    while(m){
      i = Math.floor(Math.random() * m--);
      [cards[m], cards[i]] = [cards[i], cards[m]];
    }

    return this;
  }

  draw(){
    let card = (this.cards.length < 1) ? 'None left' : this.cards.pop();
    this.showIt(card);
    return card;
  }
  
  showIt(card) {
    alert(card);
  }
}

/** settingsGear       ------------------------------------------------------------
 * Returns an svg icon of a settings gear
 */
function settingsGear() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
  svg.classList.add('gear');
  setAttributes(svg, {width: '2em',  height: '2em',  viewBox: '0 0 34 34'});
  const rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
  setAttributes(rect, {id: 'rect-1',  x: '14',  y: '1',  width: '5.5',  height: '11',  rx: '2.5',  ry: '2.5',  stroke: 'none',  fill: 'black'});
  svg.appendChild(rect);
  for (deg = 45; deg <= 315; deg += 45) {
    const use = document.createElementNS("http://www.w3.org/2000/svg", 'use');
    setAttributes(use, {href: '#rect-1',  transform: `rotate(${deg}, 17, 17)`});
    svg.appendChild(use);
  }
  const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
  setAttributes(circle, {cx: '17', cy: '17', r: '7.5', 'stroke-width': '5', stroke: 'black', fill: 'none'});
  svg.appendChild(circle);
  return svg;
}


/** Globals       -------------------------------------------------------------------
 *
 */
let metroTimer;
let deck;

/** init()       -------------------------------------------------------------------------
 *
 */
function init() {
  // Create the metroTimer
  metroTimer = new MetroTimer();

  // create a slider object from each element that contains a range input
  let sliderObjs = {};
  let sliderDivs = document.getElementsByClassName("slider");
  for (const div of sliderDivs) {
    let nso = (div.classList.contains('nudge')) ? new NudgeSlider(div) : new Slider(div);
    sliderObjs[nso.id] = nso;
  }
  
  // add an output formatting function to each slider object
  // that controls how the slider value is displayed
  sliderObjs['Tempo'].formatValue = function () 
    {
      let out;
      if (this.slider.value < metroTimer.minimumTempo) {
        out = 'Timer only';
      } else {
        out = this.slider.value + ' bpm (' + (60 / this.slider.value).toPrecision(2) + ' spb )';
      }
      return out;
    };
  sliderObjs['Volume'].formatValue = function () {return this.slider.value;};
  sliderObjs['Time'].formatValue = function () {return (this.slider.value == 0) ? '' : 'target: ' + secs2MinsSecs(this.slider.value);};
  sliderObjs['Count'].formatValue = function () {return (this.slider.value == 0) ? '' : 'target: ' + this.slider.value;};
  
  // add a change handler function to each slider object
  // that transfers its value into the metroTimer
  sliderObjs['Tempo'].changedValue = function () {metroTimer.tempo = this.slider.value;};
  sliderObjs['Volume'].changedValue = function () {metroTimer.volume = this.slider.value;};  
  sliderObjs['Time'].changedValue = function () {metroTimer.timeLimit = (this.slider.value > 0) ? parseInt(this.slider.value) : null;};
  sliderObjs['Count'].changedValue = function () {metroTimer.countLimit = (this.slider.value > 0) ? parseInt(this.slider.value) : null;};

  // display the initial value on each slider
  for (let s in sliderObjs) {
      sliderObjs[s].showValue();
  }
  
  // set metronome pace to slider value
  metroTimer.tempo = sliderObjs['Tempo'].slider.value;

  // create a button object for each button element in the action div
  let buttonObjs = {};
  let elem = document.getElementById("Action");
  let buttonElems = elem.getElementsByTagName('button');
  for (const btn of buttonElems) {
    let nbo = new Button(btn);
    buttonObjs[nbo.name] = nbo;
  }
  // add a settings gear icon
  let gear = settingsGear();
  gear.addEventListener('click', showSettingsSheet);
  elem.getElementsByTagName('div')[0].appendChild(gear);
  
  // add a click handler function to each button object
  // that executes the metroTimer methods
  buttonObjs['Start/Stop'].handleClick = function () {metroTimer.toggleStartStop();};
  buttonObjs['Pause/Restart'].handleClick = function () {this.toggleLabel(); metroTimer.toggleStartStop();};
  
  // Tell metroTimer where to display the counter and timer.
  metroTimer.reportCountElement = sliderObjs['Count'].reportSpan;
  metroTimer.reportTimeElement = sliderObjs['Time'].reportSpan; 
  // Tell metroTimer which button to toggle the Start/Stop label
  metroTimer.startStopButton = buttonObjs['Start/Stop'];
  
  // create the Dice object
  new Dice(document.getElementById("Dice"));
  
  //create the Cards object  
  deck = new Cards();
  // tell it where to show the drawn card
  let showCardSpan = document.getElementById('Cards').getElementsByTagName('span')[1];
  deck.showIt = function (c) {showCardSpan.innerHTML = c;};
  // tell buttons what to do
  let buttons = document.getElementById('Cards').getElementsByTagName('button');
  buttons[0].addEventListener('click', () => deck.draw());
  buttons[1].addEventListener('click', () => deck.reset());
  buttons[2].addEventListener('click', () => deck.shuffle());

/*
  let util = document.getElementById('utility');
  let bm = 0;
  for (let i = 0; i < 20; i++) {
    util.innerHTML += `<br />${i} - ${i % 2 + 1} - ${i % 4 + 1} - ${bm++ % 4 + 1} - ${i % 6 + 1} - ${i % 8 + 1}`;
  }
*/
}

function showSettingsSheet() {
  document.getElementById('MetroTimerSettings').classList.add('shown');
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function secs2MinsSecs(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function setAttributes(el, attrs) {
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value)); 
}

/** Tone      -----------------------------------------------------
class Tone {
  constructor (aContext = null, frequency = 440, delay = 0, gain = .4, beatDuration = 4) 
  {
    this.frequency = frequency;
    this.delay = delay;
    this.beatDuration = beatDuration;
    this.gain = gain;
    this.numTones = 1;
    
    this.audioContext = aContext === null ? null : aContext;
  }
  
  start () {
    this.audioContext = this.audioContext === null ? new window.AudioContext() : this.audioContext;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.value = this.frequency;
    gain.gain.setValueAtTime(this.gain, this.audioContext.currentTime);
    
    osc.start(this.audioContext.currentTime + this.delay);
    osc.stop(this.audioContext.currentTime + this.beatDuration + this.delay);
  }
}

calls in init for Tone
  var tone1 = new Tone(undefined, 261.63, undefined);
  var tone2 = new Tone(tone1.audioContext, 329.63, 1);
  var tone3 = new Tone(tone1.audioContext, 392.00, 1);
  var tone4 = new Tone(tone1.audioContext, 523.25, 2);

 */

/** Timer       ----------------------------------------------------------------------
class Timer {
  constructor(reportElement) {
    this.isRunning = false;
    this.intervalId;
    this.now = 1;
    this.reportElement = reportElement;
  }
  
  start() {
    if(this.isRunning) return;
    this.showTime();
    this.intervalId = setInterval(() => {this.showTime();}, 1000);
    this.isRunning = true;
  }
  
  stop() {
    clearInterval(this.intervalId);
    this.isRunning = false;
    this.now = 1;
  }
  
  pause() {
    clearInterval(this.intervalId);
    this.isRunning = false;
  }
  
  togglePauseRestart() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }
    
  toggleStartStop() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  showTime(reportElement) {
    let mins = Math.floor(this.now / 60);
    let secs = this.now % 60;
    let timeStr = mins + ":" + (secs < 10 ? '0' : '') + secs;
    this.reportElement.innerHTML = timeStr;
    this.now++;
  }
}
*/
