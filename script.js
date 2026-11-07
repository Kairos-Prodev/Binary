const canvas = document.getElementById("fire");
const ctx = canvas.getContext("2d", { alpha: false });

const PIXEL_SIZE = 5;
const GAP = 1;

let width = 0;
let height = 0;
let columns = 0;
let rows = 0;
let cells = [];

let lastFrame = 0;
const FPS = 40;
const FRAME_INTERVAL = 1000 / FPS;

const seed = Math.random() * 1000;

function random(x, y) {
    const value = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
    return value - Math.floor(value);
}

function smoothNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    const fx = x - ix;
    const fy = y - iy;

    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const a = random(ix, iy);
    const b = random(ix + 1, iy);
    const c = random(ix, iy + 1);
    const d = random(ix + 1, iy + 1);

    const top = a + (b - a) * sx;
    const bottom = c + (d - c) * sx;

    return top + (bottom - top) * sy;
}

function fbm(x, y) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;

    for (let i = 0; i < 4; i++) {
        value += smoothNoise(x * frequency, y * frequency) * amplitude;
        frequency *= 2;
        amplitude *= 0.5;
    }

    return value;
}

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const step = PIXEL_SIZE + GAP;

    columns = Math.ceil(width / step);
    rows = Math.ceil(height / step);

    cells = [];

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            cells.push({
                x,
                y,
                phase: Math.random() * Math.PI * 2,
                variation: Math.random()
            });
        }
    }
}

function flameField(x, y, time) {
    const center = columns * 0.5;
    const vertical = 1 - y / rows;

    const baseWidth = columns * 0.24;

    const turbulence1 =
        Math.sin(y * 0.075 - time * 2.3) * columns * 0.035;

    const turbulence2 =
        Math.sin(y * 0.14 + time * 1.7) * columns * 0.025;

    const noise = fbm(
        x * 0.035 + time * 0.15,
        y * 0.045 - time * 0.55
    );

    const widthVariation = noise * columns * 0.065;

    const flameWidth =
        baseWidth * Math.pow(Math.max(0, vertical), 0.72) +
        turbulence1 +
        turbulence2 +
        widthVariation;

    const movingCenter =
        center +
        Math.sin(y * 0.045 - time * 1.4) * columns * 0.035 +
        Math.sin(y * 0.11 + time * 0.9) * columns * 0.015;

    const distance = Math.abs(x - movingCenter);
    const edge = flameWidth - distance;

    const tongues =
        Math.sin(x * 0.075 + time * 2.2) +
        Math.sin(x * 0.13 - time * 1.4);

    const upperFlames =
        vertical > 0.25 &&
        vertical < 0.95 &&
        tongues > 0.8 &&
        edge > -columns * 0.035;

    if (edge <= 0 && !upperFlames) return null;

    const normalizedDistance = Math.max(
        0,
        Math.min(1, distance / Math.max(1, flameWidth))
    );

    const heatNoise = fbm(
        x * 0.06 + time * 0.3,
        y * 0.055 - time * 0.9
    );

    const verticalHeat = Math.max(0, Math.min(1, vertical));

    let intensity =
        1 -
        normalizedDistance * 0.65 +
        heatNoise * 0.3 +
        verticalHeat * 0.2;

    intensity += Math.sin(
        y * 0.12 - time * 5 + x * 0.035
    ) * 0.12;

    intensity = Math.max(0, Math.min(1, intensity));

    return {
        intensity,
        distance: normalizedDistance,
        vertical: verticalHeat
    };
}

function flameColor(intensity, distance, vertical, time, phase) {
    const flicker =
        Math.sin(time * 7 + phase) * 0.5 +
        Math.sin(time * 11 + phase * 1.7) * 0.25 +
        Math.sin(time * 3 + phase * 0.5) * 0.25;

    const brightness = Math.max(
        0,
        Math.min(1, intensity + flicker * 0.12)
    );

    let r, g, b;

    if (distance < 0.22 && vertical < 0.65) {
        r = 255;
        g = 225 + brightness * 30;
        b = 150 + brightness * 105;
    } else if (distance < 0.48) {
        r = 255;
        g = 135 + brightness * 100;
        b = 15 + brightness * 35;
    } else if (distance < 0.78) {
        r = 255;
        g = 65 + brightness * 95;
        b = 3 + brightness * 15;
    } else {
        r = 190 + brightness * 65;
        g = 15 + brightness * 65;
        b = 2 + brightness * 10;
    }

    return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
}

function animate(timestamp) {
    requestAnimationFrame(animate);

    if (timestamp - lastFrame < FRAME_INTERVAL) return;

    lastFrame = timestamp;

    const time = timestamp * 0.001;
    const step = PIXEL_SIZE + GAP;

    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, width, height);

    for (const cell of cells) {
        const field = flameField(cell.x, cell.y, time);

        if (!field) continue;

        const flicker =
            Math.sin(time * 5 + cell.phase) +
            Math.sin(time * 9 + cell.variation * 10);

        const intensity = Math.max(
            0,
            Math.min(1, field.intensity + flicker * 0.06)
        );

        ctx.fillStyle = flameColor(
            intensity,
            field.distance,
            field.vertical,
            time,
            cell.phase
        );

        ctx.fillRect(
            cell.x * step,
            cell.y * step,
            PIXEL_SIZE,
            PIXEL_SIZE
        );
    }
}

window.addEventListener("resize", resize);

resize();
requestAnimationFrame(animate);