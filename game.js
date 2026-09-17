const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const overlayAction = document.getElementById('overlayAction');

// Konfigurasi Grid & Ukuran
const WIDTH = 900;
const HEIGHT = 550; // Tinggi lapangan (di luar header 50px)
const CELL = 20;

// Variabel State Game
let snake = [];
let food = null;
let bigFood = null;
let bigFoodTimer = 0;
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let score = 0;
let highscore = localStorage.getItem('snake_highscore') || 0;
let speed = 8;
let moveTimer = 0;
let lastTime = 0;

let gameState = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'

// Efek Makan Apel
let eatEffect = null;

const BIG_FOOD_DURATION = 5000;
const BIG_FOOD_CHANCE = 0.0015;
const EAT_EFFECT_DURATION = 350;

highscoreEl.textContent = `High Score: ${highscore}`;

// ==========================================
// KONTROL INPUT
// ==========================================
window.addEventListener('keydown', (e) => {
    if (gameState === 'MENU' || gameState === 'GAMEOVER') {
        if (e.key === 'Enter') resetGame();
        return;
    }

    if (e.key === ' ') {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            showOverlay('PAUSED', '', 'TEKAN SPACE UNTUK LANJUT');
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            hideOverlay();
        }
        return;
    }

    if (gameState === 'PLAYING') {
        switch (e.key) {
            case 'ArrowUp':
                if (direction.y === 0) nextDirection = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
                if (direction.y === 0) nextDirection = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
                if (direction.x === 0) nextDirection = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
                if (direction.x === 0) nextDirection = { x: 1, y: 0 };
                break;
        }
    }
});

function setDirectionFromInput(dx, dy) {
    if (gameState === 'PLAYING') {
        if (dx === 0 && dy === -1 && direction.y === 0) nextDirection = { x: 0, y: -1 };
        if (dx === 0 && dy === 1 && direction.y === 0) nextDirection = { x: 0, y: 1 };
        if (dx === -1 && dy === 0 && direction.x === 0) nextDirection = { x: -1, y: 0 };
        if (dx === 1 && dy === 0 && direction.x === 0) nextDirection = { x: 1, y: 0 };
    }
}

// Tombol On-screen D-Pad
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

[btnUp, btnDown, btnLeft, btnRight].forEach((btn) => {
    btn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (btn === btnUp) setDirectionFromInput(0, -1);
        if (btn === btnDown) setDirectionFromInput(0, 1);
        if (btn === btnLeft) setDirectionFromInput(-1, 0);
        if (btn === btnRight) setDirectionFromInput(1, 0);
    });
    btn.addEventListener('click', (event) => {
        event.preventDefault();
    });
});

overlay.addEventListener('pointerdown', () => {
    if (gameState === 'MENU' || gameState === 'GAMEOVER') resetGame();
});

// ==========================================
// LOGIKA GAME
// ==========================================
function newFood() {
    while (true) {
        let x = Math.floor(Math.random() * (WIDTH / CELL)) * CELL;
        let y = Math.floor(Math.random() * (HEIGHT / CELL)) * CELL;
        let onSnake = snake.some(segment => segment.x === x && segment.y === y);
        if (!onSnake) return { x, y };
    }
}

function newBigFood() {
    while (true) {
        let x = Math.floor(Math.random() * ((WIDTH / CELL) - 2)) * CELL;
        let y = Math.floor(Math.random() * ((HEIGHT / CELL) - 2)) * CELL;
        let onSnake = snake.some(segment => segment.x === x && segment.y === y);
        if (!onSnake && (!food || (food.x !== x && food.y !== y))) {
            return { x, y };
        }
    }
}

function resetGame() {
    snake = [
        { x: 400, y: 300 },
        { x: 380, y: 300 },
        { x: 360, y: 300 },
        { x: 340, y: 300 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = 8;
    food = newFood();
    bigFood = null;
    bigFoodTimer = 0;
    eatEffect = null;
    
    scoreEl.textContent = `Score: ${score}`;
    gameState = 'PLAYING';
    hideOverlay();
}

function moveSnake() {
    direction = { ...nextDirection };
    let head = {
        x: snake[0].x + direction.x * CELL,
        y: snake[0].y + direction.y * CELL
    };

    // Tabrak Dinding
    if (head.x < 0 || head.x >= WIDTH || head.y < 0 || head.y >= HEIGHT) {
        triggerGameOver();
        return;
    }

    // Tabrak Badan Sendiri
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        triggerGameOver();
        return;
    }

    snake.unshift(head);

    // Makan Buah Besar
    const ateBigFood = bigFood &&
        head.x >= bigFood.x && head.x < bigFood.x + CELL * 2 &&
        head.y >= bigFood.y && head.y < bigFood.y + CELL * 2;

    if (ateBigFood) {
        for (let i = 0; i < 5; i++) {
            snake.push({ ...snake[snake.length - 1] });
        }
        score += 5;
        updateScore();
        bigFood = null;
        bigFoodTimer = 0;
        speed = Math.min(20, 8 + Math.floor(score / 3));
    } 
    // Makan Buah Biasa
    else if (food && head.x === food.x && head.y === food.y) {
        eatEffect = {
            x: food.x + 10,
            y: food.y + 10,
            timer: EAT_EFFECT_DURATION
        };
        score += 1;
        updateScore();
        food = newFood();
        speed = Math.min(20, 8 + Math.floor(score / 3));
    } else {
        snake.pop();
    }
}

function updateScore() {
    scoreEl.textContent = `Score: ${score}`;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('snake_highscore', highscore);
        highscoreEl.textContent = `High Score: ${highscore}`;
    }
}

function triggerGameOver() {
    gameState = 'GAMEOVER';
    showOverlay('GAME OVER', `Score Akhir: ${score}`, 'TEKAN ENTER ATAU KLIK UNTUK MAIN LAGI');
}

// ==========================================
// RENDER & EFEK VISUAL
// ==========================================
function drawBackground() {
    ctx.fillStyle = '#23642d';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = '#2a7334';
    ctx.lineWidth = 1;

    for (let x = 0; x < WIDTH; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }
}

function drawFood() {
    if (!food) return;
    let { x, y } = food;

    // Bayangan
    ctx.fillStyle = 'rgba(20, 50, 20, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 17, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apel
    ctx.fillStyle = '#821414';
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2828';
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Kilauan
    ctx.fillStyle = '#ff8282';
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Batang & Daun
    ctx.strokeStyle = '#502d14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, x + 2);
    ctx.lineTo(x + 12, y - 4);
    ctx.stroke();

    ctx.fillStyle = '#64dc64';
    ctx.beginPath();
    ctx.ellipse(x + 13, y - 4, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawBigFood() {
    if (!bigFood) return;
    let { x, y } = bigFood;

    // Lingkaran luar beranimasi
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Apel Besar
    ctx.fillStyle = '#dc2828';
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 18, 0, Math.PI * 2);
    ctx.fill();

    // Kilauan
    ctx.fillStyle = '#ff9696';
    ctx.beginPath();
    ctx.arc(x + 14, y + 14, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawEatEffect(dt) {
    if (!eatEffect) return;

    eatEffect.timer -= dt;
    if (eatEffect.timer <= 0) {
        eatEffect = null;
        return;
    }

    let progress = 1 - (eatEffect.timer / EAT_EFFECT_DURATION);
    let radius = 8 + progress * 35;
    let alpha = 1 - progress;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 220, 40, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(eatEffect.x, eatEffect.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Partikel Percikan
    for (let i = 0; i < 8; i++) {
        let angle = (i / 8) * Math.PI * 2;
        let dist = 10 + progress * 30;
        let px = eatEffect.x + Math.cos(angle) * dist;
        let py = eatEffect.y + Math.sin(angle) * dist;

        ctx.fillStyle = `rgba(255, 240, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, 4 - progress * 3), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawSnake() {
    // Badan Ular
    for (let i = snake.length - 1; i > 0; i--) {
        let { x, y } = snake[i];
        ctx.fillStyle = '#2daa41';
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#64dc64';
        ctx.beginPath();
        ctx.arc(x + 7, y + 7, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Kepala Ular
    let head = snake[0];
    ctx.fillStyle = '#145f23';
    ctx.beginPath();
    ctx.arc(head.x + 10, head.y + 10, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2daa41';
    ctx.beginPath();
    ctx.arc(head.x + 10, head.y + 10, 9, 0, Math.PI * 2);
    ctx.fill();

    // Posisi Mata
    let eye1 = { x: head.x + 5, y: head.y + 5 };
    let eye2 = { x: head.x + 15, y: head.y + 5 };

    if (direction.x === 1) {
        eye1 = { x: head.x + 15, y: head.y + 5 };
        eye2 = { x: head.x + 15, y: head.y + 15 };
    } else if (direction.x === -1) {
        eye1 = { x: head.x + 5, y: head.y + 5 };
        eye2 = { x: head.x + 5, y: head.y + 15 };
    } else if (direction.y === 1) {
        eye1 = { x: head.x + 5, y: head.y + 15 };
        eye2 = { x: head.x + 15, y: head.y + 15 };
    }

    // Mata Putih & Pupil
    [eye1, eye2].forEach(eye => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
    });
}

function showOverlay(title, subtitle, action) {
    overlayTitle.textContent = title;
    overlaySubtitle.textContent = subtitle;
    overlayAction.textContent = action;
    overlay.style.display = 'flex';
}

function hideOverlay() {
    overlay.style.display = 'none';
}

// ==========================================
// MAIN LOOP
// ==========================================
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = timestamp - lastTime;
    lastTime = timestamp;

    if (gameState === 'PLAYING') {
        moveTimer += dt;

        // Spawn Buah Besar secara acak
        if (!bigFood && Math.random() < BIG_FOOD_CHANCE) {
            bigFood = newBigFood();
            bigFoodTimer = BIG_FOOD_DURATION;
        }

        if (bigFood) {
            bigFoodTimer -= dt;
            if (bigFoodTimer <= 0) {
                bigFood = null;
                bigFoodTimer = 0;
            }
        }

        // Interval Gerak Ular berdasarkan Kecepatan
        let delay = 1000 / speed;
        if (moveTimer >= delay) {
            moveTimer = 0;
            moveSnake();
        }
    }

    // Drawing
    drawBackground();
    drawFood();
    drawBigFood();
    drawEatEffect(dt);
    if (gameState !== 'MENU') {
        drawSnake();
    }

    requestAnimationFrame(gameLoop);
}

// Jalankan Loop Utama
requestAnimationFrame(gameLoop);