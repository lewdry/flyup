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

// Array to store multiple paper airplanes
let paperAirplanes = [];

// Constants for movement
const PLANE_SPEED = 10; // Base speed
const GRAVITY = 5;
const LOOP_RADIUS = 30; // Initial radius of the loop
const LOOP_SPEED = 0.05; // Speed of the looping motion
const EXPANSION_RATE = 1; // Rate at which the loop expands

// Dragging state
let isDragging = false;
let draggedPlane = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastTime = 0;

// Current color for the paper airplane
let currentColor = '';

// Function to generate a random color
function generateRandomColor() {
    return `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
}

// All the important stuff
function initGame() {
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    window.addEventListener('resize', resizeCanvas);
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

    if (splashScreen.style.display !== 'none') {
        splashScreen.style.display = 'none';
    }

    let clickedPlane = paperAirplanes.find(plane => isPointInside(pos, plane));

    if (clickedPlane) {
        if (clickedPlane.state === '2paper') {
            launchPaperAirplane(clickedPlane);
        } else if (clickedPlane.state === '1blank') {
            transformPaperAirplane(clickedPlane, '2paper');
        }
    } else {
        currentColor = generateRandomColor();
        createPaperAirplane(pos.x, pos.y);
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
    fetch('1blank.svg')
        .then(response => response.text())
        .then(svgData => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            // Apply the current color to all path elements
            svgElement.querySelectorAll('path').forEach(path => {
                path.setAttribute('fill', currentColor);
            });

            const svgString = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
            
            img.onload = () => {
                const newPlane = {
                    x: x - 25,
                    y: y - 25,
                    width: 50,
                    height: 50,
                    image: img,
                    state: '1blank',
                    vx: 0,
                    vy: 0,
                    color: currentColor,
                    centerX: x - 25,
                    centerY: y - 25,
                    loopAngle: 0,
                    loopRadius: LOOP_RADIUS,
                    rotation: 0
                };
                paperAirplanes.push(newPlane);
            };
        });
}

function launchPaperAirplane(plane) {
    const angle = Math.random() * Math.PI * 2; // Random initial angle
    plane.vx = Math.cos(angle) * PLANE_SPEED;
    plane.vy = Math.sin(angle) * PLANE_SPEED;
    plane.loopAngle = 0; // Starting angle for the loop
    plane.loopRadius = LOOP_RADIUS; // Starting radius for the loop
    plane.centerX = plane.x; // Center X of the loop
    plane.centerY = plane.y; // Center Y of the loop
    plane.state = '2paper';
}

function transformPaperAirplane(plane, newState) {
    const svgFileName = newState === '3crump' ? '3crump.svg' : '2paper.svg';
    fetch(svgFileName)
        .then(response => response.text())
        .then(svgData => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            // Apply the plane's color to all path elements
            svgElement.querySelectorAll('path').forEach(path => {
                path.setAttribute('fill', plane.color);
            });

            const svgString = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
            
            img.onload = () => {
                plane.image = img;
                plane.state = newState;

                if (newState === '2paper') {
                    launchPaperAirplane(plane);
                } else if (newState === '3crump') {
                    // Start falling
                    plane.vx = 0;
                    plane.vy = 0;
                }
            };
        });
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
    currentColor = generateRandomColor(); // Generate new color for next game
    showSplashScreen();
}

// Update the drawing function to rotate the plane
function drawPaperAirplanes() {
    paperAirplanes.forEach(plane => {
        if (plane.image) {
            ctx.save();
            ctx.translate(plane.x + plane.width / 2, plane.y + plane.height / 2);
            if (plane.rotation) {
                ctx.rotate(plane.rotation);
            }
            ctx.drawImage(plane.image, -plane.width / 2, -plane.height / 2, plane.width, plane.height);
            ctx.restore();
        }
    });
}

function updatePaperAirplanes(deltaTime) {
    paperAirplanes.forEach((plane, index) => {
        if (plane.state === '2paper') {
            // Update loop angle
            plane.loopAngle += LOOP_SPEED;

            // Calculate new position based on looping motion
            const loopX = Math.cos(plane.loopAngle) * plane.loopRadius;
            const loopY = Math.sin(plane.loopAngle) * plane.loopRadius;

            // Update plane position
            plane.x = plane.centerX + loopX + plane.vx * deltaTime;
            plane.y = plane.centerY + loopY + plane.vy * deltaTime;

            // Gradually increase loop radius for expanding motion
            plane.loopRadius += EXPANSION_RATE;

            // Update the center of the loop
            plane.centerX += plane.vx * deltaTime;
            plane.centerY += plane.vy * deltaTime;

            // Rotate the plane image
            plane.rotation = Math.atan2(plane.vy + Math.cos(plane.loopAngle) * LOOP_SPEED * plane.loopRadius, 
                                        plane.vx - Math.sin(plane.loopAngle) * LOOP_SPEED * plane.loopRadius);

            // Check for collisions with canvas edges
            if (plane.x <= 0 || plane.x + plane.width >= canvas.width / dpr ||
                plane.y <= 0 || plane.y + plane.height >= canvas.height / dpr) {
                transformPaperAirplane(plane, '3crump');
            }
        } else if (plane.state === '3crump') {
            // Apply gravity to make it fall
            plane.vy += GRAVITY;
            plane.y += plane.vy * deltaTime;

            // Check for collisions with other crumpled papers
            for (let i = 0; i < index; i++) {
                if (paperAirplanes[i].state === '3crump' && checkCollision(plane, paperAirplanes[i])) {
                    plane.y = paperAirplanes[i].y - plane.height;
                    plane.vy = 0;
                    break;
                }
            }

            // Stop at the bottom of the screen
            if (plane.y + plane.height > canvas.height / dpr) {
                plane.y = canvas.height / dpr - plane.height;
                plane.vy = 0;
            }
        }
    });
}

function checkCollision(plane1, plane2) {
    return plane1.x < plane2.x + plane2.width &&
           plane1.x + plane1.width > plane2.x &&
           plane1.y < plane2.y + plane2.height &&
           plane1.y + plane1.height > plane2.y;
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update paper airplane positions and check for collisions
    updatePaperAirplanes(deltaTime);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw paper airplanes
    drawPaperAirplanes();

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
//canvas.addEventListener('dblclick', handleDoubleTap, false);
//canvas.addEventListener('touchstart', handleDoubleTap, false);
window.addEventListener('resize', resizeCanvas);