// Copied from https://portfolio.edparadis.com/portfolio/codepen/

const calcF = (r1, r2, c1, c2) => {
  return 1/ (2 * Math.PI * Math.sqrt(r1*r2*c1*c2))
}
const calcQ = (r1, r2, c1, c2) => {
  if( c1 == c2) {
    return Math.sqrt(r2/r1) / 2
  } else {
    return Math.sqrt(r2/r1) / (Math.sqrt(c1/c2)+Math.sqrt(c2/c1))
  }
}
const calcT = (f, Q) => {
  return Q/f
}

const r1 = () => {
  return Number(document.querySelector("input#sliderR1").value)
}
const r2 = () => {
  return Number(document.querySelector("input#sliderR2").value)
}
const c1 = () => {
  return Number(document.querySelector("input#sliderC1").value)
}
const c2 = () => {
  return Number(document.querySelector("input#sliderC2").value)
}

const setLabel = (name, val, units) => {
  document.querySelector("span#label"+name).innerText = `${Math.round(val)} ${units}`
}

let getF
let getT

const recalculate = (e) => {
    const _r1 = r1() + 500
    const _r2 = r2() + 100000
    const _c1 = c1() / 1e9 + 1e-9 // nanofarads
    const _c2 = c2() / 1e9 + 1e-9 // nanofarads
    const f = calcF(_r1, _r2, _c1, _c2); getF = () => { return f }
    const Q = calcQ(_r1, _r2, _c1, _c2)
    const T = calcT(f, Q) * 1000; getT = () => { return T }
    setLabel("F", f, 'Hz')
    setLabel("Q", Q, '')
    setLabel("T", T, 'ms')
    setLabel("R1", _r1, 'ohms')
    setLabel("R2", _r2 / 1000, 'k ohms')
    setLabel("C1", _c1 * 1e9, 'nF')
    setLabel("C2", _c2 * 1e9, 'nF')
 }

const setupSlider = (slider, max, initValue) => {
  slider.min = 0
  slider.max = max
  slider.step = 10
  slider.value = initValue
  slider.addEventListener('input', recalculate)
  slider.addEventListener('change', (e)=>{
    document.querySelector('select#presets').value = ""
  })
}

setupSlider(document.querySelector("input#sliderR1"), 5000, 0)
setupSlider(document.querySelector("input#sliderR2"), 5000000, 4.3e6)
setupSlider(document.querySelector("input#sliderC1"), 100, 12)
setupSlider(document.querySelector("input#sliderC2"), 100, 12)
recalculate()

const audioCtx = new AudioContext();
masterGainNode = audioCtx.createGain();
masterGainNode.connect(audioCtx.destination);
masterGainNode.gain.setValueAtTime(0.2, audioCtx.currentTime) // shhhhh

const playDrum = (e)=>{
  const vca = audioCtx.createGain();
  vca.gain.setValueAtTime(1, audioCtx.currentTime);
  vca.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + getT() / 1000)
  vca.connect(masterGainNode)
  const osc = audioCtx.createOscillator();
  osc.type = "sine"
  osc.connect(vca);
  osc.frequency.setValueAtTime(getF(), audioCtx.currentTime)
  osc.start();
  osc.stop(audioCtx.currentTime + 3)
  window.setTimeout(()=>{
    delete osc
    delete vca
  }, 3100)
}

document.querySelector("button#playbtn").addEventListener('mousedown', playDrum)

document.querySelector('select#presets').addEventListener('input',(e)=>{
  switch(e.target.value) {
    case 'woodblock':
      setPreset(1000,2200e3,11,11)
      break;
    case 'bassdrum':
      setPreset(2200, 1000e3, 71, 71)
      break;
    case 'hightom':
      setPreset(500, 4600e3, 33, 33)
      break;
    case 'knock':
      setPreset(0, 5000e3, 11, 1)
      break;
    default:
      break;
  }
})

const setPreset = (r1, r2, c1, c2) => {
  document.querySelector("input#sliderR1").value = r1
  document.querySelector("input#sliderR2").value = r2
  document.querySelector("input#sliderC1").value = c1
  document.querySelector("input#sliderC2").value = c2
  recalculate()
}

document.querySelector('select#volume').addEventListener('input',(e)=>{
  const val = e.target.value
  if( val === 'high') {
  masterGainNode.gain.setValueAtTime(0.9, audioCtx.currentTime)
  } else if( val === 'mid') {
    masterGainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
  } else {
    masterGainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)
  }
})

document.querySelector('select#pattern').addEventListener('change',(e)=>{
  switch(e.target.value) {
    case 'four':
      playPattern(500, 500, 500, 500)
      break
    case 'sync':
      playPattern(333/2, 333/2, 334, 1333)
      break
    case 'none':
    default:
      playPattern(0, 0, 0, 0)
  }
})

let interval;
const playPattern = (a, b, c, d) => {
  clearInterval(interval)
  if( a == 0 && b == 0 && c == 0 && d == 0) {
    return
  }
  interval = setInterval(()=>{
    setTimeout(playDrum, a)
    setTimeout(playDrum, a+b)
    setTimeout(playDrum, a+b+c)
    setTimeout(playDrum, a+b+c+d)

  }, a+b+c+d)
}