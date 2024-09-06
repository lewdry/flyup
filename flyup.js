// Constants
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const splashScreen = document.getElementById('splashScreen');

// Device pixel ratio for high PPI scaling
const dpr = window.devicePixelRatio || 1;

// Set canvas size to match window
function resizeCanvas() {
    const logicalWidth = window.innerWidth;
    const logicalHeight = window.innerHeight;
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    ctx.scale(dpr, dpr);
}

// Initial canvas size
resizeCanvas();

// Paper airplane object
let paperAirplane = null;

// Dragging state
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastPos = { x: 0, y: 0 };
let currentPos = { x: 0, y: 0 };
let lastTime = 0;

// All the important stuff
function initGame() {
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    window.addEventListener('resize', resizeCanvas);
    resetGame();
    showSplashScreen();
    requestAnimationFrame(gameLoop);
}

// Loads
function showSplashScreen() {
    splashScreen.style.display = 'flex';
}

const FIXED_TIME_STEP = 1000 / 60;
let gameRunning = false;

function handleStart(event) {
    event.preventDefault();
    const pos = getEventPos(event);

    if (!gameRunning) {
        splashScreen.style.display = 'none';
        gameRunning = true;
        createPaperAirplane(pos.x, pos.y);
        return;
    }

    if (paperAirplane && isPointInside(pos, paperAirplane)) {
        isDragging = true;
        dragOffsetX = pos.x - paperAirplane.x;
        dragOffsetY = pos.y - paperAirplane.y;
        lastPos = { x: paperAirplane.x, y: paperAirplane.y };
        currentPos = { x: paperAirplane.x, y: paperAirplane.y };
        lastTime = Date.now();
    }
}

function handleMove(event) {
    event.preventDefault();
    if (isDragging && paperAirplane) {
        const pos = getEventPos(event);
        paperAirplane.x = pos.x - dragOffsetX;
        paperAirplane.y = pos.y - dragOffsetY;
        currentPos = { x: paperAirplane.x, y: paperAirplane.y };
    }
}

function handleEnd(event) {
    event.preventDefault();
    if (isDragging && paperAirplane) {
        const now = Date.now();
        const dt = (now - lastTime) / 1000; // Convert to seconds
        if (paperAirplane.state === '2paper' && dt > 0) {
            const dx = (currentPos.x - lastPos.x) / dt;
            const dy = (currentPos.y - lastPos.y) / dt;
            const speed = Math.sqrt(dx * dx + dy * dy);
            const maxSpeed = 10000;
            const factor = Math.min(speed / maxSpeed, 1);
            paperAirplane.vx = dx * factor;
            paperAirplane.vy = dy * factor;
        } else if (paperAirplane.state === '1blank') {
            transformPaperAirplane();
        }
    }
    isDragging = false;
}

function handleCancel(event) {
    event.preventDefault();
    isDragging = false;
}

function handleDoubleTap(event) {
    event.preventDefault();
    resetGame();
}

function createPaperAirplane(x, y) {
    const img = new Image();
    img.src = '1blank.svg';
    img.onload = () => {
        paperAirplane = {
            x: x - 25, // Center the 50x50 image on the click point
            y: y - 25,
            width: 50,
            height: 50,
            image: img,
            state: '1blank',
            vx: 0,
            vy: 0
        };
    };
}

function transformPaperAirplane(newState) {
    if (paperAirplane) {
        const img = new Image();
        img.src = newState === '3crump' ? '3crump.svg' : '2paper.svg';
        img.onload = () => {
            paperAirplane.image = img;
            paperAirplane.state = newState === '3crump' ? '3crump' : '2paper';

            // Make sure to keep any existing velocity after transformation
            if (newState === '2paper') {
                // Optionally: Apply a boost to velocity or ensure it's moving
                paperAirplane.vx = paperAirplane.vx || 1;
                paperAirplane.vy = paperAirplane.vy || 1;
            }
        };
    }
}

function isPointInside(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
}

function getEventPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    return {
        x: (clientX - rect.left) * scaleX / dpr,
        y: (clientY - rect.top) * scaleY / dpr
    };
}

function resetGame() {
    paperAirplane = null;
    isDragging = false;
    gameRunning = false;
    showSplashScreen();
}

function updatePaperAirplane(deltaTime) {
    if (paperAirplane && paperAirplane.state === '2paper' && !isDragging) {
        paperAirplane.x += paperAirplane.vx * deltaTime;
        paperAirplane.y += paperAirplane.vy * deltaTime;

        // Check for collisions with canvas edges
        if (paperAirplane.x <= 0 || paperAirplane.x + paperAirplane.width >= canvas.width / dpr) {
            paperAirplane.vx *= -1;
            transformPaperAirplane('3crump');
        }
        if (paperAirplane.y <= 0 || paperAirplane.y + paperAirplane.height >= canvas.height / dpr) {
            paperAirplane.vy *= -1;
            transformPaperAirplane('3crump');
        }

        // Apply some drag to slow down the paper airplane
        const drag = 0.99;
        paperAirplane.vx *= drag;
        paperAirplane.vy *= drag;

        // Stop the paper airplane if it's moving very slowly
        if (Math.abs(paperAirplane.vx) < 0.1 && Math.abs(paperAirplane.vy) < 0.1) {
            paperAirplane.vx = 250;
            paperAirplane.vy = 250;
        }
    }
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update paper airplane position and check for collisions
    updatePaperAirplane(deltaTime);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw paper airplane
    if (paperAirplane && paperAirplane.image) {
        ctx.drawImage(paperAirplane.image, paperAirplane.x, paperAirplane.y, paperAirplane.width, paperAirplane.height);
    }

    requestAnimationFrame(gameLoop);
}

window.onload = initGame;

// Event listeners
document.addEventListener('touchstart', handleStart, false);
document.addEventListener('mousedown', handleStart, false);
canvas.addEventListener('touchmove', handleMove, false);
canvas.addEventListener('mousemove', handleMove, false);
canvas.addEventListener('touchend', handleEnd, false);
canvas.addEventListener('mouseup', handleEnd, false);
canvas.addEventListener('touchcancel', handleCancel, false);
canvas.addEventListener('dblclick', handleDoubleTap, false);
canvas.addEventListener('touchstart', handleDoubleTap, false);
window.addEventListener('resize', resizeCanvas);