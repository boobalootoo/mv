const startButton = document.getElementById('startButton');
const visualizerCanvas = document.getElementById('visualizer');
const canvasContext = visualizerCanvas.getContext('2d');

let visualizationMode = "bars";
let audioContext, analyser, dataArray, animationId;

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
      canvasContext.fillStyle = `rgb(${barHeight + 50}, 50, 200)`;
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

    canvasContext.strokeStyle = "rgb(0, 255, 0)";
    canvasContext.lineWidth = 2;
    canvasContext.stroke();
  } else if (visualizationMode === "ocean") {
    drawPixelOcean();
  }
}

function drawPixelOcean() {
  animationId = requestAnimationFrame(drawPixelOcean);
  canvasContext.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

  analyser.getByteFrequencyData(dataArray);

  let pixelSize = 10;
  let cols = Math.floor(visualizerCanvas.width / pixelSize);
  let rows = Math.floor(visualizerCanvas.height / pixelSize);
  let boatX = visualizerCanvas.width / 2;
  let boatY = visualizerCanvas.height / 2;

  for (let i = 0; i < cols; i++) {
    let barHeight = dataArray[i % dataArray.length] / 3;
    let waveHeight = Math.sin(i / 5) * barHeight + 50;

    for (let j = 0; j < rows; j++) {
      let colorIntensity = Math.max(0, 255 - j * 5 - waveHeight);
      canvasContext.fillStyle = `rgb(0, 0, ${colorIntensity})`;
      canvasContext.fillRect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
    }

    if (i === Math.floor(cols / 2)) {
      boatY = visualizerCanvas.height - waveHeight - pixelSize * 2;
    }
  }

  drawBoat(boatX, boatY);
}

function drawBoat(x, y) {
  canvasContext.fillStyle = "brown";
  canvasContext.fillRect(x - 10, y, 20, 10);
  canvasContext.fillStyle = "white";
  canvasContext.fillRect(x - 5, y - 10, 10, 10);
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

    canvasContext.strokeStyle = "rgb(255, 255, 0)";
    canvasContext.lineWidth = 2;
    canvasContext.beginPath();
    canvasContext.moveTo(x1, y1);
    canvasContext.lineTo(x2, y2);
    canvasContext.stroke();
  }
}

startButton.addEventListener('click', () => {
  if (!audioContext || audioContext.state === 'suspended') {
    startAudioCapture();
  }
});
