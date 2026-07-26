/* ==========================================================================
   AURA 75 - WEB AUDIO ACOUSTIC SOUND TEST PLAYER & WAVEFORM VISUALIZER
   Synthesizes authentic custom mechanical keyboard switch sounds in real-time
   ========================================================================== */

let audioCtx = null;
let currentSwitchType = 'creamy';
let isPlaying = false;
let playInterval = null;
let soundVolume = 0.8;
let animFrameId = null;

// Audio parameters for each switch profile
const SWITCH_ACOUSTICS = {
  creamy: {
    name: 'AURA Creamy Linear (리니어)',
    desc: '부드럽고 뽀송한 조약돌 타건음 (Deep Pebble Thock)',
    pitch: 180,
    dampening: 0.12,
    resonance: 300,
    clickNoise: 0.05
  },
  thocky: {
    name: 'AURA Thocky Tactile (택타일)',
    desc: '묵직하고 명확한 도각도각 구분감 (Bouncy Tactile Bump)',
    pitch: 240,
    dampening: 0.08,
    resonance: 450,
    clickNoise: 0.15
  },
  silent: {
    name: 'AURA Silent Linear (저소음 리니어)',
    desc: '사무실에서도 완벽한 극저소음 (Ultra-Quiet Dampened)',
    pitch: 140,
    dampening: 0.22,
    resonance: 180,
    clickNoise: 0.01
  }
};

function initAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
}

// Generate realistic keypress acoustics using Web Audio API synthesis
function playSingleKeypressSound(switchType) {
  initAudioContext();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const acoustics = SWITCH_ACOUSTICS[switchType] || SWITCH_ACOUSTICS.creamy;
  const now = audioCtx.currentTime;

  // 1. Thock Low-Frequency Bottom-out Oscillator
  const thockOsc = audioCtx.createOscillator();
  const thockGain = audioCtx.createGain();

  thockOsc.type = 'sine';
  thockOsc.frequency.setValueAtTime(acoustics.pitch, now);
  thockOsc.frequency.exponentialRampToValueAtTime(40, now + acoustics.dampening);

  thockGain.gain.setValueAtTime(0.7 * soundVolume, now);
  thockGain.gain.exponentialRampToValueAtTime(0.001, now + acoustics.dampening);

  thockOsc.connect(thockGain);
  thockGain.connect(audioCtx.destination);

  // 2. High-Frequency Housing Resonance Filtered Noise
  const bufferSize = audioCtx.sampleRate * 0.08;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(acoustics.resonance, now);
  bandpass.Q.value = 3.0;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(acoustics.clickNoise * soundVolume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);

  // Start sound nodes
  thockOsc.start(now);
  thockOsc.stop(now + acoustics.dampening);

  noise.start(now);
  noise.stop(now + 0.05);

  // Trigger visual wave burst
  triggerWaveformPulse();
}

function selectSoundSwitch(switchType) {
  currentSwitchType = switchType;
  
  // Update Tab UI
  document.querySelectorAll('.switch-tab').forEach(tab => {
    if (tab.dataset.switch === switchType) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update Status Text
  const acoustics = SWITCH_ACOUSTICS[switchType];
  const nameEl = document.getElementById('currentSwitchName');
  const descEl = document.getElementById('currentSwitchDesc');
  if (nameEl) nameEl.textContent = acoustics.name;
  if (descEl) descEl.textContent = acoustics.desc;

  // Play sample immediately
  playSingleKeypressSound(switchType);
}

function togglePlaySound() {
  const btn = document.getElementById('btnPlaySound');
  const icon = document.getElementById('playIcon');

  if (isPlaying) {
    // Stop auto typing sequence
    clearInterval(playInterval);
    isPlaying = false;
    if (icon) icon.className = 'fa-solid fa-play';
    if (btn) btn.style.transform = 'scale(1)';
  } else {
    // Start fast typing rhythm sequence
    isPlaying = true;
    if (icon) icon.className = 'fa-solid fa-pause';
    if (btn) btn.style.transform = 'scale(1.1)';

    playSingleKeypressSound(currentSwitchType);

    playInterval = setInterval(() => {
      playSingleKeypressSound(currentSwitchType);
    }, 280 + Math.random() * 120);
  }
}

function setAudioVolume(val) {
  soundVolume = parseFloat(val);
}

// Canvas Waveform Visualizer Animation
let waveAmplitude = 0;

function triggerWaveformPulse() {
  waveAmplitude = 1.0;
}

function renderWaveform() {
  const canvas = document.getElementById('waveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Draw background grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Draw Dynamic Audio Waveform
  ctx.beginPath();
  ctx.lineWidth = 2.5;
  const activeColor = currentSwitchType === 'creamy' ? '#10b981' : currentSwitchType === 'thocky' ? '#38bdf8' : '#a855f7';
  ctx.strokeStyle = activeColor;
  ctx.shadowColor = activeColor;
  ctx.shadowBlur = 10;

  const sliceWidth = width / 80;
  let x = 0;
  const time = Date.now() * 0.008;

  for (let i = 0; i < 80; i++) {
    const wave = Math.sin(i * 0.2 + time) * waveAmplitude * 35;
    const noise = (Math.random() - 0.5) * waveAmplitude * 15;
    const y = (height / 2) + wave + noise;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.stroke();
  ctx.shadowBlur = 0;

  // Decay pulse amplitude
  waveAmplitude *= 0.92;
  if (waveAmplitude < 0.01) waveAmplitude = 0.05; // Ambient movement

  animFrameId = requestAnimationFrame(renderWaveform);
}

// Initialize Visualizer on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  renderWaveform();
});
