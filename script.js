
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const imageInput = document.getElementById('imageInput');
const fontSizeInput = document.getElementById('fontSize');
const speedInput = document.getElementById('speed');
const toggleButton = document.getElementById('toggleAnimation');

const placeholder = document.getElementById('placeholder');
const status = document.getElementById('status');

const sizeValue = document.getElementById('sizeValue');
const speedValue = document.getElementById('speedValue');
const resolution = document.getElementById('resolution');

let sourceImage = null;
let pixels = [];
let animationRunning = true;
let animationFrame = null;
let lastRender = 0;

let fontSize = 7;
let animationSpeed = 1;

const offscreen = document.createElement('canvas');
const offCtx = offscreen.getContext('2d', {
    willReadFrequently: true
});

const MAX_WIDTH = 1400;
const MAX_HEIGHT = 1000;

imageInput.addEventListener('change', event => {
    const file = event.target.files[0];

    if (!file) return;

    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
        sourceImage = image;

        URL.revokeObjectURL(url);

        placeholder.style.display = 'none';
        canvas.style.display = 'block';

        prepareImage();
        toggleButton.disabled = false;

        status.textContent = 'IMAGEM PROCESSADA';

        if (!animationRunning) {
            animationRunning = true;
        }

        toggleButton.textContent = 'PAUSAR ANIMAÇÃO';

        startAnimation();
    };

    image.onerror = () => {
        URL.revokeObjectURL(url);
        status.textContent = 'ERRO AO CARREGAR IMAGEM';
    };

    image.src = url;
});

function prepareImage() {
    const scale = Math.min(
        MAX_WIDTH / sourceImage.width,
        MAX_HEIGHT / sourceImage.height,
        1
    );

    const width = Math.max(
        1,
        Math.floor(sourceImage.width * scale)
    );

    const height = Math.max(
        1,
        Math.floor(sourceImage.height * scale)
    );

    offscreen.width = width;
    offscreen.height = height;

    offCtx.drawImage(sourceImage, 0, 0, width, height);

    const imageData = offCtx.getImageData(
        0, 0, width, height
    );

    pixels = imageData.data;

    renderDimensions();
}

function renderDimensions() {
    const cellWidth = fontSize * 0.62;
    const cellHeight = fontSize * 1.05;

    const columns = Math.floor(offscreen.width / cellWidth);
    const rows = Math.floor(offscreen.height / cellHeight);

    canvas.width = Math.max(1, columns * cellWidth);
    canvas.height = Math.max(1, rows * cellHeight);

    resolution.textContent = `${columns} × ${rows}`;

    ctx.font = `${fontSize}px "DM Mono", monospace`;
    ctx.textBaseline = 'top';

    canvas.dataset.columns = columns;
    canvas.dataset.rows = rows;
}

function getPixelColor(x, y) {
    const width = offscreen.width;

    const px = Math.min(width - 1, Math.floor(x));
    const py = Math.min(offscreen.height - 1, Math.floor(y));

    const index = (py * width + px) * 4;

    return [
        pixels[index],
        pixels[index + 1],
        pixels[index + 2]
    ];
}

function animate(timestamp) {
    if (!animationRunning) return;

    if (timestamp - lastRender >= 1000 / 30) {
        drawBinaryArt(timestamp);
        lastRender = timestamp;
    }

    animationFrame = requestAnimationFrame(animate);
}

function drawBinaryArt(timestamp) {
    const columns = Number(canvas.dataset.columns);
    const rows = Number(canvas.dataset.rows);

    const cellWidth = fontSize * 0.62;
    const cellHeight = fontSize * 1.05;

    const time = timestamp * 0.001 * animationSpeed;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {

            const x = col * cellWidth;
            const y = row * cellHeight;

            const color = getPixelColor(
                (col + 0.5) * offscreen.width / columns,
                (row + 0.5) * offscreen.height / rows
            );

            const index = row * columns + col;

            const phase = (index % 31) * 0.035;

            const binaryState = Math.floor(
                (time * 1.5 + phase) % 2
            );

            const character = binaryState === 0 ? '0' : '1';

            const pulse = 0.72 + (
                0.28 * (
                    0.5 + 0.5 * Math.sin(time * 1.8 + phase)
                )
            );

            const r = Math.min(255, Math.round(color[0] * pulse));
            const g = Math.min(255, Math.round(color[1] * pulse));
            const b = Math.min(255, Math.round(color[2] * pulse));

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

            ctx.fillText(character, x, y);
        }
    }
}

function startAnimation() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    animationRunning = true;
    lastRender = 0;

    animationFrame = requestAnimationFrame(animate);
}

function pauseAnimation() {
    animationRunning = false;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

fontSizeInput.addEventListener('input', event => {
    fontSize = Number(event.target.value);

    sizeValue.textContent = `${fontSize}px`;

    if (sourceImage) {
        renderDimensions();
        startAnimation();
    }
});

speedInput.addEventListener('input', event => {
    animationSpeed = Number(event.target.value);

    speedValue.textContent = `${animationSpeed}x`;
});

toggleButton.addEventListener('click', () => {
    if (animationRunning) {
        pauseAnimation();
        toggleButton.textContent = 'RETOMAR ANIMAÇÃO';
    } else {
        startAnimation();
        toggleButton.textContent = 'PAUSAR ANIMAÇÃO';
    }
});
