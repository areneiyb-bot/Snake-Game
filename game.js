
// =====================================
// SNAKE ARCADE - GAME ENGINE
// =====================================

// Get HTML elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");

const overlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startButton = document.getElementById("startButton");

// Game settings
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

// Game variables
let snake = [];
let food = {};

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let score = 0;
let highScore = loadHighScore();

let gameRunning = false;
let animationId = null;
let lastTime = 0;
let moveTimer = 0;

const START_SPEED = 100;

// =====================================
// HIGH SCORE
// =====================================

function loadHighScore() {
    try {
        return Number(localStorage.getItem("snakeArcadeHighScore")) || 0;
    } catch (error) {
        return 0;
    }
}

function saveHighScore() {
    try {
        localStorage.setItem("snakeArcadeHighScore", highScore);
    } catch (error) {
        // The game can still play if storage is unavailable.
    }
}

function updateScoreDisplay() {
    scoreElement.textContent = String(score).padStart(3, "0");
    highScoreElement.textContent = String(highScore).padStart(3, "0");
}

// =====================================
// START AND RESET GAME
// =====================================

function startGame() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    snake = [
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    score = 0;
    moveTimer = 0;
    lastTime = 0;

    spawnFood();
    updateScoreDisplay();

    gameRunning = true;
    overlay.classList.add("hidden");

    drawGame();

    animationId = requestAnimationFrame(gameLoop);
}

// =====================================
// FOOD
// =====================================

function spawnFood() {
    let validPosition = false;

    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };

        validPosition = !snake.some(
            segment => segment.x === food.x && segment.y === food.y
        );
    }
}

// =====================================
// GAME LOOP
// =====================================

function gameLoop(timestamp) {
    if (!gameRunning) return;

    if (!lastTime) {
        lastTime = timestamp;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    moveTimer += deltaTime;

    const currentSpeed = 120;

    if (moveTimer >= currentSpeed) {
        moveTimer = 0;
        updateGame();
    }

    if (gameRunning) {
        drawGame();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// =====================================
// UPDATE GAME
// =====================================

function updateGame() {
    direction = { ...nextDirection };

    const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    const eatingFood =
        newHead.x === food.x && newHead.y === food.y;

    // Check wall collision
    if (
        newHead.x < 0 ||
        newHead.x >= TILE_COUNT ||
        newHead.y < 0 ||
        newHead.y >= TILE_COUNT
    ) {
        endGame();
        return;
    }

    // Check collision with the snake itself.
    // If not eating, the tail moves away this turn.
    const bodyToCheck = eatingFood ? snake : snake.slice(0, -1);

    const hitSelf = bodyToCheck.some(
        segment => segment.x === newHead.x && segment.y === newHead.y
    );

    if (hitSelf) {
        endGame();
        return;
    }

    snake.unshift(newHead);

    if (eatingFood) {
        score += 10;

        if (score > highScore) {
            highScore = score;
            saveHighScore();
        }

        updateScoreDisplay();

        if (snake.length === TILE_COUNT * TILE_COUNT) {
            winGame();
            return;
        }

        spawnFood();
    } else {
        snake.pop();
    }
}

// =====================================
// DRAW GAME
// =====================================

function drawGame() {
    // Background
    ctx.fillStyle = "#080d19";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawFood();
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = "rgba(0, 217, 255, 0.07)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= TILE_COUNT; i++) {
        const position = i * GRID_SIZE;

        ctx.beginPath();
        ctx.moveTo(position, 0);
        ctx.lineTo(position, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, position);
        ctx.lineTo(canvas.width, position);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;

        if (index === 0) {
            // Snake head
            ctx.fillStyle = "#b6ffcb";
            ctx.shadowColor = "#39ff88";
            ctx.shadowBlur = 15;
        } else {
            // Snake body
            ctx.fillStyle = "#39ff88";
            ctx.shadowColor = "#39ff88";
            ctx.shadowBlur = 7;
        }

        ctx.fillRect(
            x + 2,
            y + 2,
            GRID_SIZE - 4,
            GRID_SIZE - 4
        );

        ctx.shadowBlur = 0;

        // Snake eyes
        if (index === 0) {
            ctx.fillStyle = "#07130d";

            let eye1;
            let eye2;

            if (direction.x === 1) {
                eye1 = { x: x + 14, y: y + 5 };
                eye2 = { x: x + 14, y: y + 12 };
            } else if (direction.x === -1) {
                eye1 = { x: x + 5, y: y + 5 };
                eye2 = { x: x + 5, y: y + 12 };
            } else if (direction.y === -1) {
                eye1 = { x: x + 5, y: y + 5 };
                eye2 = { x: x + 12, y: y + 5 };
            } else {
                eye1 = { x: x + 5, y: y + 14 };
                eye2 = { x: x + 12, y: y + 14 };
            }

            ctx.fillRect(eye1.x, eye1.y, 3, 3);
            ctx.fillRect(eye2.x, eye2.y, 3, 3);
        }
    });
}

function drawFood() {
    const centerX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = food.y * GRID_SIZE + GRID_SIZE / 2;

    ctx.save();

    ctx.shadowColor = "#ff3864";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#ff3864";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Food leaf
    ctx.fillStyle = "#39ff88";
    ctx.fillRect(centerX + 2, centerY - 10, 3, 5);

    ctx.restore();
}

// =====================================
// GAME OVER
// =====================================

function endGame() {
    gameRunning = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    overlayTitle.textContent = "GAME OVER";
    overlayMessage.textContent =
        `Your score: ${score}. Can you beat your high score?`;

    startButton.textContent = "PLAY AGAIN";

    overlay.classList.remove("hidden");
    drawGame();
}

function winGame() {
    gameRunning = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    overlayTitle.textContent = "YOU WIN!";
    overlayMessage.textContent =
        "Amazing! You filled the entire board!";

    startButton.textContent = "PLAY AGAIN";

    overlay.classList.remove("hidden");
    drawGame();
}

// =====================================
// CHANGE DIRECTION
// =====================================

function changeDirection(x, y) {
    if (!gameRunning) return;

    // Prevent reversing into yourself
    if (x === -direction.x && y === -direction.y) {
        return;
    }

    nextDirection = { x, y };
}

// Keyboard controls
document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    const movementKeys = [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "w",
        "a",
        "s",
        "d"
    ];

    if (movementKeys.includes(key)) {
        event.preventDefault();
    }

    switch (key) {
        case "arrowup":
        case "w":
            changeDirection(0, -1);
            break;

        case "arrowdown":
        case "s":
            changeDirection(0, 1);
            break;

        case "arrowleft":
        case "a":
            changeDirection(-1, 0);
            break;

        case "arrowright":
        case "d":
            changeDirection(1, 0);
            break;

        case "enter":
            if (!gameRunning) startGame();
            break;
    }
});

// =====================================
// MOBILE CONTROLS
// =====================================

function setupMobileButton(id, x, y) {
    const button = document.getElementById(id);

    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        changeDirection(x, y);
    });
}

setupMobileButton("upButton", 0, -1);
setupMobileButton("downButton", 0, 1);
setupMobileButton("leftButton", -1, 0);
setupMobileButton("rightButton", 1, 0);

// =====================================
// START BUTTON
// =====================================

startButton.addEventListener("click", startGame);

// =====================================
// INITIAL SCREEN
// =====================================

updateScoreDisplay();
drawGame();
