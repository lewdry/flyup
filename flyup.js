// Constants
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const splashScreen = document.getElementById('splashScreen');

// Set canvas size to match window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initial canvas size
resizeCanvas();



// all the important stuff



function initGame() {
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    window.addEventListener('resize', resizeCanvas);
    resetGame();

    document.addEventListener('pointerdown', handleStart, false);
    canvas.addEventListener('pointermove', handleMove, false);
    canvas.addEventListener('pointerup', handleEnd, false);
    canvas.addEventListener('pointercancel', handleEnd, false);
    canvas.addEventListener('dblclick', handleDoubleTap, false);

    showSplashScreen();
    requestAnimationFrame(gameLoop);
}


//loads


function showSplashScreen() {
    splashScreen.style.display = 'flex';
}

const FIXED_TIME_STEP = 1000 / 60;
let lastTime = 0;



function handleStart(event) {
    event.preventDefault();
    const currentTime = Date.now();
    const pos = getEventPos(event);
    interactionStartPos = pos;
    lastCursorTime = currentTime;

    if (!gameRunning) {
        splashScreen.style.display = 'none';
        gameRunning = true;
        return;
    }

}

function handleMove(event) {
    event.preventDefault();
    const pos = getEventPos(event);

}

function handleEnd(event) {
    event.preventDefault();
    
}

function handleDoubleTap(event) {
    event.preventDefault();
    const currentTime = Date.now();
    if (currentTime - lastCursorTime < 300) {
        resetGame();
    }
    lastCursorTime = currentTime;
}

window.onload = initGame;




