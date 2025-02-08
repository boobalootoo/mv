const startButton = document.getElementById('startButton');
const visualizerCanvas = document.getElementById('visualizer');
const canvasContext = visualizerCanvas.getContext('2d');

let visualizationMode = "bars";
let audioContext, analyser, dataArray, animationId, visualizerColor = "#ff0000";

function resizeCanvas() {
  visualizerCanvas.width = visualizerCanvas.offsetWidth;
  visualizerCanvas.height = visualizerCanvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

async function startAudioCapture() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    draw();
  } catch (err) {
    console.error('Error accessing audio stream:', err);
    alert('Could not access audio. Check permissions and try again.');
  }
}

function draw() {
  animationId = requestAnimationFrame(draw);
  canvasContext.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

  if (visualizationMode === "bars") {
    analyser.getByteFrequencyData(dataArray);
    const barWidth = (visualizerCanvas.width / dataArray.length) * 2.5;
    let barHeight, x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = dataArray[i];
      canvasContext.fillStyle = visualizerColor;
      canvasContext.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  } else if (visualizationMode === "waveform") {
    analyser.getByteTimeDomainData(dataArray);
    canvasContext.beginPath();
    let sliceWidth = visualizerCanvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      let v = dataArray[i] / 128.0;
      let y = v * visualizerCanvas.height / 2;
      i === 0 ? canvasContext.moveTo(x, y) : canvasContext.lineTo(x, y);
      x += sliceWidth;
    }

    canvasContext.strokeStyle = visualizerColor;
    canvasContext.lineWidth = 2;
    canvasContext.stroke();
  }
}

function drawCircular() {
  animationId = requestAnimationFrame(drawCircular);
  canvasContext.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
  analyser.getByteFrequencyData(dataArray);

  let centerX = visualizerCanvas.width / 2;
  let centerY = visualizerCanvas.height / 2;
  let radius = 100;

  for (let i = 0; i < dataArray.length; i++) {
    let angle = (i / dataArray.length) * Math.PI * 2;
    let barHeight = dataArray[i] / 2;
    let x1 = centerX + Math.cos(angle) * radius;
    let y1 = centerY + Math.sin(angle) * radius;
    let x2 = centerX + Math.cos(angle) * (radius + barHeight);
    let y2 = centerY + Math.sin(angle) * (radius + barHeight);

    canvasContext.strokeStyle = visualizerColor;
    canvasContext.lineWidth = 2;
    canvasContext.beginPath();
    canvasContext.moveTo(x1, y1);
    canvasContext.lineTo(x2, y2);
    canvasContext.stroke();
  }
}

let scene, camera, renderer, bars = [];
function init3D() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.z = 50;
  for (let i = 0; i < dataArray.length; i++) {
    let geometry = new THREE.BoxGeometry(1, 1, 1);
    let material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });
    let bar = new THREE.Mesh(geometry, material);
    bar.position.x = i - dataArray.length / 2;
    scene.add(bar);
    bars.push(bar);
  }
}

function animate3D() {
  requestAnimationFrame(animate3D);
  analyser.getByteFrequencyData(dataArray);
  for (let i = 0; i < dataArray.length; i++) {
    bars[i].scale.y = dataArray[i] / 10;
  }
  renderer.render(scene, camera);
}

document.getElementById("fftSize").addEventListener("change", (event) => {
  analyser.fftSize = parseInt(event.target.value);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
});

document.getElementById("colorPicker").addEventListener("input", (event) => {
  visualizerColor = event.target.value;
});

startButton.addEventListener('click', () => {
  if (!audioContext || audioContext.state === 'suspended') {
    startAudioCapture();
  }
});