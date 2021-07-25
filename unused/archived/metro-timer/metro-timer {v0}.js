/** Class Metronome --------------------------------------------------------------
 *  Copied from GIT referenced in https://grantjam.es/creating-a-simple-metronome-using-javascript-and-the-web-audio-api
 */
class Metronome
{
    constructor(reportElement, tempo = 120)
    {
        this.audioContext = null;
        this.notesInQueue = [];         // notes that have been put into the web audio and may or may not have been played yet {note, time}
        this.currentQuarterNote = 0;
        this.tempo = tempo;
        this.lookahead = 25;          // How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1;   // How far ahead to schedule audio (sec)
        this.nextNoteTime = 0.0;     // when the next note is due
        this.isRunning = false;
        this.intervalID = null;
        this.duration = .03;
        this.frequency1 = 1000;
        this.frequency2 = 800;
        this.gain = 1;
        this.count = 0;
        this.reportElement = reportElement;
    }

    nextNote()
    {
        // Advance current note and time by a quarter note (crotchet if you're posh)
        var secondsPerBeat = 60.0 / this.tempo; // Notice this picks up the CURRENT tempo value to calculate beat length.
        this.nextNoteTime += secondsPerBeat; // Add beat length to last beat time
    
        this.currentQuarterNote++;    // Advance the beat number, wrap to zero
        if (this.currentQuarterNote == 4) {
            this.currentQuarterNote = 0;
        }
    }

    scheduleNote(beatNumber, time)
    {
        // push the note on the queue, even if we're not playing.
        this.notesInQueue.push({ note: beatNumber, time: time });
    
        // create an oscillator
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();
        
//        osc.frequency.value = (beatNumber % 4 == 0) ? 1000 : 800;
        osc.frequency.value = (beatNumber % 4 == 0) ? this.frequency1 : this.frequency2;
//        envelope.gain.value = 1;
        envelope.gain.value = this.gain;
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);
    
        osc.start(time);
//        osc.stop(time + 0.03);
        osc.stop(time + this.duration);
        this.count += 1;
        //console.log(this.count);
        setTimeout(() => this.reportElement.innerHTML = this.count, 50); // 50 ms delay better syncs sound with visual 
    }

    scheduler()
    {
        // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime ) {
            this.scheduleNote(this.currentQuarterNote, this.nextNoteTime);
            this.nextNote();
        }
    }

    start()
    {
        if (this.isRunning) return;

        if (this.audioContext == null)
        {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        this.isRunning = true;

        this.currentQuarterNote = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        this.count = 0;

        this.intervalID = setInterval(() => this.scheduler(), this.lookahead);
    }

    stop()
    {
        this.isRunning = false;

        clearInterval(this.intervalID);
    }

    startStop()
    {
        if (this.isRunning) {
            this.stop();
        }
        else {
            this.start();
        }
    }
}

// class Tone 
// {
  // constructor (aContext = null, frequency = 440, delay = 0, gain = .4, duration = 4) 
  // {
    // this.frequency = frequency;
    // this.delay = delay;
    // this.duration = duration;
    // this.gain = gain;
    // this.numTones = 1;
    
    // this.audioContext = aContext === null ? null : aContext;
  // }
  
  // start () {
    // this.audioContext = this.audioContext === null ? new window.AudioContext() : this.audioContext;

    // const osc = this.audioContext.createOscillator();
    // const gain = this.audioContext.createGain();
    
    // osc.connect(gain);
    // gain.connect(this.audioContext.destination);
    
    // osc.frequency.value = this.frequency;
    // gain.gain.setValueAtTime(this.gain, this.audioContext.currentTime);
    
    // osc.start(this.audioContext.currentTime + this.delay);
    // osc.stop(this.audioContext.currentTime + this.duration + this.delay);
  // }
// }

  // let ids = ['tempo', 'time', 'count', 'buttons'];
  // let paras = [];
  // let inputs = [];
  // let spans = [];
  let buttons = [];
  let timerIsRunning = false;
  let timerIntervalId;
  let timerSeconds = 0;
  let timerCountElement;
  
  class Slider {
    constructor (para) {
      let spans = para.getElementsByTagName('span');
      
      this.slider = para.getElementsByTagName('input')[0];
      this.titleSpan = spans[0];
      this.valueSpan = spans[1];
      this.reportSpan = spans[2];
      this.id = para.id;
      
      this.slider.addEventListener('input', () => {this.sliderChange();});
      
      this.showValue();
    }
    
    showValue() {
      this.valueSpan.innerHTML = this.slider.value;
    }
    
    sliderChange() {
      this.showValue();
      window['changed' + this.id](this.slider.value);
    }
  }
  
  class NudgeSlider extends Slider {
    constructor(para) {
      super(para);
      let buttons = para.getElementsByTagName('button');
      this.downButton = buttons[0];
      this.upButton = buttons[1];
      this.downButton.innerHTML = '-' + this.slider.step;
      this.upButton.innerHTML = '+' + this.slider.step;
      this.downButton.addEventListener('click', () => {this.nudge(false);});
      this.upButton.addEventListener('click', () => {this.nudge(true);});
    }
    
    nudge(up) {
      if (up) {
        this.slider.stepUp();
      } else {
        this.slider.stepDown();
      }
      this.showValue();
    }
  }
  
  class Timer {
    constructor(reportElement) {
      this.isRunning = false;
      this.intervalId;
      this.now = 1;
      this.reportElement = reportElement;
    }
    
    start() {
      this.showTime();
      // let closureVal = this.reportElement;
      // this.intervalId = setInterval(this.showTime(closureVal), 1000);
      this.intervalId = setInterval(() => {this.showTime();}, 1000);
      this.isRunning = true;
      // return 'timer started';
    }
    
    stop() {
      clearInterval(this.intervalId);
      this.isRunning = false;
      this.now = 1;
      // return 'timer stopped';
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
  
    showTime(reportElement) {
      let mins = Math.floor(this.now / 60);
      let secs = this.now % 60;
      let timeStr = mins + ":" + (secs < 10 ? '0' : '') + secs;
      this.reportElement.innerHTML = timeStr;
      this.now++;
    }
  }
  
  class Button {
    constructor(elem) {
      this.labels = [];
      if (elem.classList.contains('toggle')) {
        this.labels = elem.getAttribute('name').split('/');
        this.isToggle = true;
      } else {
        this.labels[0] = elem.getAttribute('name');
        this.isToggle = false;
      }
      this.labelNow = 0;
      this.elem = elem;
      
      this.showLabel();
      
      this.elem.addEventListener('click', () => {window['clicked' + this.labels.join('')](this);});
    }
    
    showLabel() {
      this.elem.innerHTML = this.labels[this.labelNow];
    }
    
    toggleLabel() {
      this.labelNow = this.labelNow == 0 ? 1 : 0;
      this.showLabel();
    }
  }
  
  let sliders = {};
  let metronome;
  let timer;
  
  function init() {
  // var tone1 = new Tone(undefined, 261.63, undefined);
  // var tone2 = new Tone(tone1.audioContext, 329.63, 1);
  // var tone3 = new Tone(tone1.audioContext, 392.00, 1);
  // var tone4 = new Tone(tone1.audioContext, 523.25, 2);

    let sliderParas = document.getElementsByClassName("slider");
    for (let i = 0; i < sliderParas.length; i++) {
      let ns;
      if (sliderParas[i].classList.contains('nudge')) {
        ns = new NudgeSlider(sliderParas[i]);
      } else {
        ns = new Slider(sliderParas[i]);
      }
      sliders[ns.id] = ns;
    }
    
    let buttonElems = document.getElementById("action").getElementsByTagName('button');
    for (let i = 0; i < buttonElems.length; i++) {
      b = new Button(buttonElems[i]);
    }
    
    metronome = new Metronome(sliders['Count'].reportSpan);
    timer = new Timer(sliders['Time'].reportSpan);
  }
  
  function changedTempo(newTempo) {
    metronome.stop();
    timer.stop();
    metronome.tempo = newTempo;
  }
  
  function changedTime(newTime) { 
  }
  
  function changedCount(newCount) {
  }
  
  function clickedStart(button) {
    timer.start();
    metronome.start();
  }
  
  function clickedStop(button) {
    timer.stop();
    metronome.stop();
  }
  
  function clickedStartStop(button) {
    button.toggleLabel();
  }
  
  function clickedPauseRestart(button) {
    button.toggleLabel();
    timer.togglePauseRestart();
  }

/*   
    
    for (let i = 0; i < ids.length; i++) {
      paras[i] = document.getElementById(ids[i]);
      spans[i] = paras[i].getElementsByTagName('span')[0];
      if (ids[i] == 'buttons') {
        buttons = document.getElementById(ids[i]).getElementsByTagName('button');
        for (let j = 0; j < buttons.length; j++) {
          buttons[j].addEventListener('click', buttonClicked);
        }
      } else {
        inputs[i] = paras[i].getElementsByTagName('input')[0];
        inputs[i].addEventListener('change', rangeChanged);
      }
    }
    let metronomeCountElement = paras[2].getElementsByTagName('span')[1];
    metronome = new Metronome(metronomeCountElement);
    timerCountElement = paras[1].getElementsByTagName('span')[1];
  }
  
  function rangeChanged() {
    let whichIdx = ids.indexOf(this.parentElement.id);
    let oldValue = getSpan(whichIdx);
    let newRawValue = inputs[whichIdx].value;
    let newValue = adjustValue(whichIdx, oldValue);
    inputs[whichIdx].value = newValue;
    setSpan(whichIdx, newValue);
    switch (whichIdx) {
      case 0: // change tempo
        metronome.stop();
        timerStop();
        metronome.tempo = newValue;
    }
  }
  
  function adjustValue(whichIdx, oldV) {
    let newV = inputs[whichIdx].value;
    let maxV = inputs[whichIdx].max;
    let minV = inputs[whichIdx].min;
    let step = inputs[whichIdx].step;
    let range = maxV - minV;
    let delta = newV - oldV;
    let deltaABS = Math.abs(delta);
    let deltaABSProportion = deltaABS / range;
    if (deltaABSProportion < .08) {
      adjusted = oldV + (delta < 0 ? -1 : 1) * step;
    } else {
      adjusted = newV;
    }
    //let effectiveRange = deltaABSProportion < .15 ? step : range;
    //let change = effectiveRange * (deltaABS / range);
    //let adjusted = oldV + (delta < 0 ? -1 : 1) * Math.max(1, change);
    return adjusted;
  }
*/

/*
  function buttonClicked(idx) {
    let whichIdx = ids.indexOf('buttons');
    let whichButton = this.innerText;
    setSpan(whichIdx, whichButton);
    if (whichButton == 'Start') {
      metronome.start();
      timerStart();
    } else {
      metronome.stop();
      timerStop();
    }
    //tone1.start();
    //tone2.start();
    //tone3.start();
    //tone4.start();
  }
*/

/*
  function getSpan(idx) {
    let text = spans[idx].innerHTML;
    let number = parseInt(text);
    return number;
  }
  
  function setSpan(idx, text) {
    if (ids[idx] == 'buttons') {
      spans[idx].innerHTML = text;
    } else {
      spans[idx].innerHTML = inputs[idx].value;
    }
  }
*/


/*
var tempo = document.getElementById('tempo');
tempo.textContent = metronome.tempo;

var playPauseIcon = document.getElementById('play-pause-icon');

var playButton = document.getElementById('play-button');
playButton.addEventListener('click', function() {
    metronome.startStop();

    if (metronome.isRunning) {
        playPauseIcon.className = 'pause';
    }
    else {
        playPauseIcon.className = 'play';
    }

});
*/

/*
var tempoChangeButtons = document.getElementsByClassName('tempo-change');
for (var i = 0; i < tempoChangeButtons.length; i++) {
    tempoChangeButtons[i].addEventListener('click', function() {
        metronome.tempo += parseInt(this.dataset.change);
        tempo.textContent = metronome.tempo;
    });
}
*/


    /*
    //var range = document.getElementById("range");
    var range = document.getElementsByTagName("input")[0];
    var bg = document.getElementsByTagName("div")[0];
    var para = document.getElementsByTagName("p")[0];
    <!-- var span = para.getElementsByTagName("span")[0]; -->
    function hexFromDecimal(dec) {
      var hex = ((dec < 16) ? "0" : "") + dec.toString(16);
      return "#" + hex + hex + hex;
    }

    range.addEventListener("change", function() {
      //bg.style.setProperty('--bg-opacity', this.value);
      var dec = parseInt(255 * this.value);
      bg.style.setProperty('--bg-color', hexFromDecimal(dec));
      dec = parseInt(255 * (.25 + (.5*this.value)));
      <!-- dec = 255 - dec; -->
      para.style.setProperty('--ctrl-color', hexFromDecimal(dec));
      <!-- span.innerHTML = "range: " + this.value + ", dec: " + dec + ", hex: " + hexFromDecimal(dec); -->
    });
    */
