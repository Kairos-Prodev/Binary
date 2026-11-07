const canvas = document.getElementById("fire");
const ctx = canvas.getContext("2d");

let width;
let height;
let columns;
let rows;

const fontSize = 13;
const cellWidth = 9;
const cellHeight = 13;

let particles = [];

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    columns = Math.ceil(width / cellWidth);
    rows = Math.ceil(height / cellHeight);

    createFlame();
}

function createFlame() {
    particles = [];

    const centerX = columns / 2;
    const baseY = rows * 0.83;
    const flameHeight = rows * 0.65;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {

            const nx = (x - centerX) / (columns * 0.5);
            const ny = (baseY - y) / flameHeight;

            if (ny < 0 || ny > 1) continue;

            const flameWidth = 0.025 + 0.48 * Math.pow(1 - ny, 0.72);

            const irregularity =
                Math.sin(x * 0.12 + y * 0.08) * 0.025 +
                Math.sin(x * 0.04 - y * 0.15) * 0.018;

            if (Math.abs(nx) > flameWidth + irregularity) continue;

            const distance = Math.abs(nx) / flameWidth;

            particles.push({
                x: x * cellWidth,
                y: y * cellHeight,
                nx,
                ny,
                distance,
                seed: Math.random() * Math.PI * 2,
                binary: Math.random() > 0.5 ? 1 : 0,
                phase: Math.random() * 10
            });
        }
    }
}

function getColor(p, time) {
    const wave =
        Math.sin(time * 3.5 + p.seed + p.ny * 12) * 0.5 +
        Math.sin(time * 6 + p.seed * 2) * 0.25 +
        Math.sin(time * 2 + p.nx * 15) * 0.25;

    const flicker = (wave + 1) / 2;

    const core = p.distance < 0.25 && p.ny < 0.65;

    if (core) {
        return `rgba(255, ${220 + flicker * 35}, ${130 + flicker * 125}, ${0.65 + flicker * 0.35})`;
    }

    if (p.distance < 0.55) {
        return `rgba(255, ${120 + flicker * 120}, ${15 + flicker * 50}, ${0.7 + flicker * 0.3})`;
    }

    if (p.distance < 0.8) {
        return `rgba(255, ${55 + flicker * 100}, ${5 + flicker * 20}, ${0.65 + flicker * 0.3})`;
    }

    return `rgba(${180 + flicker * 75}, ${20 + flicker * 65}, 5, ${0.5 + flicker * 0.35})`;
}

function animate(timestamp) {
    const time = timestamp * 0.001;

    ctx.clearRect(0, 0, width, height);

    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const p of particles) {
        const change = Math.sin(time * 4 + p.seed + p.phase);

        const binary = change > 0 ? "1" : "0";

        ctx.fillStyle = getColor(p, time);

        ctx.fillText(
            binary,
            p.x,
            p.y
        );
    }

    requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);

resize();
requestAnimationFrame(animate);