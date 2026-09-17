// ==========================================
// CANVAS
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


// ==========================================
// UI ELEMENTS
// ==========================================

const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const overlayAction = document.getElementById('overlayAction');


// ==========================================
// KONFIGURASI GAME
// ==========================================

const WIDTH = 900;
const HEIGHT = 550;

const CELL = 20;


// ==========================================
// STATE GAME
// ==========================================

let snake = [];

let food = null;

let bigFood = null;
let bigFoodTimer = 0;

let direction = {
    x: 1,
    y: 0
};

let nextDirection = {
    x: 1,
    y: 0
};


let score = 0;

let highscore =
    Number(
        localStorage.getItem('snake_highscore')
    ) || 0;


let speed = 8;

let moveTimer = 0;

let lastTime = 0;


let gameState = 'MENU';
// MENU
// PLAYING
// PAUSED
// GAMEOVER


// ==========================================
// EFFECT
// ==========================================

let eatEffect = null;

const BIG_FOOD_DURATION = 5000;

const BIG_FOOD_CHANCE = 0.0015;

const EAT_EFFECT_DURATION = 350;


// ==========================================
// INITIAL SCORE
// ==========================================

highscoreEl.textContent =
    `High Score: ${highscore}`;


// ==========================================
// KEYBOARD CONTROL
// ==========================================

window.addEventListener('keydown', (e) => {

    // MENU / GAME OVER
    if (
        gameState === 'MENU' ||
        gameState === 'GAMEOVER'
    ) {

        if (e.key === 'Enter') {
            resetGame();
        }

        return;
    }


    // PAUSE
    if (e.key === ' ') {

        e.preventDefault();

        if (gameState === 'PLAYING') {

            gameState = 'PAUSED';

            showOverlay(
                'PAUSED',
                '',
                'TEKAN SPACE UNTUK LANJUT'
            );

        } else if (
            gameState === 'PAUSED'
        ) {

            gameState = 'PLAYING';

            hideOverlay();
        }

        return;
    }


    // MOVEMENT
    if (gameState === 'PLAYING') {

        switch (e.key) {

            case 'ArrowUp':

                if (direction.y === 0) {
                    nextDirection = {
                        x: 0,
                        y: -1
                    };
                }

                break;


            case 'ArrowDown':

                if (direction.y === 0) {
                    nextDirection = {
                        x: 0,
                        y: 1
                    };
                }

                break;


            case 'ArrowLeft':

                if (direction.x === 0) {
                    nextDirection = {
                        x: -1,
                        y: 0
                    };
                }

                break;


            case 'ArrowRight':

                if (direction.x === 0) {
                    nextDirection = {
                        x: 1,
                        y: 0
                    };
                }

                break;
        }
    }

});


// ==========================================
// MOBILE INPUT
// ==========================================

function setDirectionFromInput(dx, dy) {

    if (gameState !== 'PLAYING') {
        return;
    }


    if (
        dx === 0 &&
        dy === -1 &&
        direction.y === 0
    ) {

        nextDirection = {
            x: 0,
            y: -1
        };
    }


    if (
        dx === 0 &&
        dy === 1 &&
        direction.y === 0
    ) {

        nextDirection = {
            x: 0,
            y: 1
        };
    }


    if (
        dx === -1 &&
        dy === 0 &&
        direction.x === 0
    ) {

        nextDirection = {
            x: -1,
            y: 0
        };
    }


    if (
        dx === 1 &&
        dy === 0 &&
        direction.x === 0
    ) {

        nextDirection = {
            x: 1,
            y: 0
        };
    }

}


// ==========================================
// MOBILE BUTTONS
// ==========================================

const btnUp =
    document.getElementById('btnUp');

const btnDown =
    document.getElementById('btnDown');

const btnLeft =
    document.getElementById('btnLeft');

const btnRight =
    document.getElementById('btnRight');


btnUp.addEventListener(
    'pointerdown',
    (event) => {

        event.preventDefault();

        setDirectionFromInput(0, -1);
    }
);


btnDown.addEventListener(
    'pointerdown',
    (event) => {

        event.preventDefault();

        setDirectionFromInput(0, 1);
    }
);


btnLeft.addEventListener(
    'pointerdown',
    (event) => {

        event.preventDefault();

        setDirectionFromInput(-1, 0);
    }
);


btnRight.addEventListener(
    'pointerdown',
    (event) => {

        event.preventDefault();

        setDirectionFromInput(1, 0);
    }
);


// ==========================================
// OVERLAY CLICK
// ==========================================

overlay.addEventListener(
    'pointerdown',
    () => {

        if (
            gameState === 'MENU' ||
            gameState === 'GAMEOVER'
        ) {

            resetGame();
        }

    }
);


// ==========================================
// CREATE NORMAL FOOD
// ==========================================

function newFood() {

    let attempts = 0;

    while (attempts < 1000) {

        attempts++;

        const x =
            Math.floor(
                Math.random() *
                (WIDTH / CELL)
            ) * CELL;


        const y =
            Math.floor(
                Math.random() *
                (HEIGHT / CELL)
            ) * CELL;


        const onSnake =
            snake.some(
                segment =>
                    segment.x === x &&
                    segment.y === y
            );


        if (!onSnake) {

            return {
                x,
                y
            };
        }

    }

    return {
        x: 0,
        y: 0
    };
}


// ==========================================
// CREATE BIG FOOD
// ==========================================

function newBigFood() {

    let attempts = 0;

    while (attempts < 1000) {

        attempts++;

        const x =
            Math.floor(
                Math.random() *
                ((WIDTH / CELL) - 2)
            ) * CELL;


        const y =
            Math.floor(
                Math.random() *
                ((HEIGHT / CELL) - 2)
            ) * CELL;


        const onSnake =
            snake.some(
                segment =>
                    segment.x >= x &&
                    segment.x < x + CELL * 2 &&
                    segment.y >= y &&
                    segment.y < y + CELL * 2
            );


        const overlapsFood =
            food &&
            (
                food.x >= x &&
                food.x < x + CELL * 2 &&
                food.y >= y &&
                food.y < y + CELL * 2
            );


        if (
            !onSnake &&
            !overlapsFood
        ) {

            return {
                x,
                y
            };
        }

    }

    return null;
}


// ==========================================
// RESET GAME
// ==========================================

function resetGame() {

    snake = [

        {
            x: 400,
            y: 300
        },

        {
            x: 380,
            y: 300
        },

        {
            x: 360,
            y: 300
        },

        {
            x: 340,
            y: 300
        }

    ];


    direction = {
        x: 1,
        y: 0
    };


    nextDirection = {
        x: 1,
        y: 0
    };


    score = 0;

    speed = 8;

    moveTimer = 0;

    food = newFood();

    bigFood = null;

    bigFoodTimer = 0;

    eatEffect = null;


    scoreEl.textContent =
        `Score: ${score}`;


    gameState = 'PLAYING';

    hideOverlay();
}


// ==========================================
// MOVE SNAKE
// ==========================================

function moveSnake() {

    direction = {
        ...nextDirection
    };


    const head = {

        x:
            snake[0].x +
            direction.x * CELL,

        y:
            snake[0].y +
            direction.y * CELL

    };


    // ======================================
    // WALL COLLISION
    // ======================================

    if (
        head.x < 0 ||
        head.x >= WIDTH ||
        head.y < 0 ||
        head.y >= HEIGHT
    ) {

        triggerGameOver();

        return;
    }


    // ======================================
    // SELF COLLISION
    // ======================================

    const hitsBody =
        snake.some(
            segment =>
                segment.x === head.x &&
                segment.y === head.y
        );


    if (hitsBody) {

        triggerGameOver();

        return;
    }


    snake.unshift(head);


    // ======================================
    // BIG FOOD COLLISION
    // ======================================

    const ateBigFood =
        bigFood &&
        head.x >= bigFood.x &&
        head.x < bigFood.x + CELL * 2 &&
        head.y >= bigFood.y &&
        head.y < bigFood.y + CELL * 2;


    if (ateBigFood) {

        // Tambah 5 segmen
        for (
            let i = 0;
            i < 5;
            i++
        ) {

            snake.push({
                ...snake[snake.length - 1]
            });
        }


        score += 5;

        updateScore();


        bigFood = null;

        bigFoodTimer = 0;


        speed =
            Math.min(
                20,
                8 + Math.floor(score / 3)
            );


        return;
    }


    // ======================================
    // NORMAL FOOD
    // ======================================

    const ateFood =
        food &&
        head.x === food.x &&
        head.y === food.y;


    if (ateFood) {

        eatEffect = {

            x:
                food.x + CELL / 2,

            y:
                food.y + CELL / 2,

            timer:
                EAT_EFFECT_DURATION

        };


        score += 1;

        updateScore();


        food = newFood();


        speed =
            Math.min(
                20,
                8 + Math.floor(score / 3)
            );

    } else {

        // Tidak makan = ekor bergerak
        snake.pop();

    }

}


// ==========================================
// UPDATE SCORE
// ==========================================

function updateScore() {

    scoreEl.textContent =
        `Score: ${score}`;


    if (score > highscore) {

        highscore = score;


        localStorage.setItem(
            'snake_highscore',
            highscore
        );


        highscoreEl.textContent =
            `High Score: ${highscore}`;
    }

}


// ==========================================
// GAME OVER
// ==========================================

function triggerGameOver() {

    gameState = 'GAMEOVER';


    showOverlay(
        'GAME OVER',
        `Score Akhir: ${score}`,
        'TEKAN ENTER ATAU KLIK UNTUK MAIN LAGI'
    );

}


// ==========================================
// DRAW BACKGROUND
// ==========================================

function drawBackground() {

    // Rumput
    ctx.fillStyle = '#23642d';

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // Grid
    ctx.strokeStyle = '#2a7334';

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x < WIDTH;
        x += CELL
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            HEIGHT
        );

        ctx.stroke();
    }


    for (
        let y = 0;
        y < HEIGHT;
        y += CELL
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            WIDTH,
            y
        );

        ctx.stroke();
    }

}


// ==========================================
// DRAW NORMAL FOOD
// ==========================================

function drawFood() {

    if (!food) {
        return;
    }


    const {
        x,
        y
    } = food;


    // Shadow
    ctx.fillStyle =
        'rgba(20, 50, 20, 0.5)';

    ctx.beginPath();

    ctx.ellipse(
        x + 10,
        y + 17,
        8,
        4,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Apple dark
    ctx.fillStyle = '#821414';

    ctx.beginPath();

    ctx.arc(
        x + 10,
        y + 10,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Apple red
    ctx.fillStyle = '#dc2828';

    ctx.beginPath();

    ctx.arc(
        x + 8,
        y + 8,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Highlight
    ctx.fillStyle = '#ff8282';

    ctx.beginPath();

    ctx.arc(
        x + 5,
        y + 5,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Stem
    ctx.strokeStyle = '#502d14';

    ctx.lineWidth = 2;

    ctx.beginPath();

    // BUG LAMA DIPERBAIKI:
    // sebelumnya menggunakan x + 2
    ctx.moveTo(
        x + 10,
        y + 2
    );

    ctx.lineTo(
        x + 12,
        y - 4
    );

    ctx.stroke();


    // Leaf
    ctx.fillStyle = '#64dc64';

    ctx.beginPath();

    ctx.ellipse(
        x + 13,
        y - 4,
        4,
        2,
        Math.PI / 4,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ==========================================
// DRAW BIG FOOD
// ==========================================

function drawBigFood() {

    if (!bigFood) {
        return;
    }


    const {
        x,
        y
    } = bigFood;


    // Golden circle
    ctx.strokeStyle = '#ffd700';

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        x + 20,
        y + 20,
        24,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    // Big apple
    ctx.fillStyle = '#dc2828';

    ctx.beginPath();

    ctx.arc(
        x + 20,
        y + 20,
        18,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Highlight
    ctx.fillStyle = '#ff9696';

    ctx.beginPath();

    ctx.arc(
        x + 14,
        y + 14,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ==========================================
// EAT EFFECT
// ==========================================

function drawEatEffect(dt) {

    if (!eatEffect) {
        return;
    }


    eatEffect.timer -= dt;


    if (eatEffect.timer <= 0) {

        eatEffect = null;

        return;
    }


    const progress =
        1 -
        (
            eatEffect.timer /
            EAT_EFFECT_DURATION
        );


    const radius =
        8 + progress * 35;


    const alpha =
        1 - progress;


    ctx.save();


    ctx.strokeStyle =
        `rgba(255, 220, 40, ${alpha})`;

    ctx.lineWidth = 3;


    ctx.beginPath();

    ctx.arc(
        eatEffect.x,
        eatEffect.y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    // Particles
    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const angle =
            (i / 8) *
            Math.PI *
            2;


        const distance =
            10 +
            progress * 30;


        const px =
            eatEffect.x +
            Math.cos(angle) *
            distance;


        const py =
            eatEffect.y +
            Math.sin(angle) *
            distance;


        ctx.fillStyle =
            `rgba(255, 240, 100, ${alpha})`;


        ctx.beginPath();

        ctx.arc(
            px,
            py,
            Math.max(
                1,
                4 - progress * 3
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    ctx.restore();

}


// ==========================================
// DRAW SNAKE
// ==========================================

function drawSnake() {

    if (
        !snake ||
        snake.length === 0
    ) {
        return;
    }


    // ======================================
    // BODY
    // ======================================

    for (
        let i = snake.length - 1;
        i > 0;
        i--
    ) {

        const {
            x,
            y
        } = snake[i];


        // Dark body
        ctx.fillStyle = '#2daa41';

        ctx.beginPath();

        ctx.arc(
            x + 10,
            y + 10,
            9,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Body highlight
        ctx.fillStyle = '#64dc64';

        ctx.beginPath();

        ctx.arc(
            x + 7,
            y + 7,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    // ======================================
    // HEAD
    // ======================================

    const head = snake[0];


    // Dark head
    ctx.fillStyle = '#145f23';

    ctx.beginPath();

    ctx.arc(
        head.x + 10,
        head.y + 10,
        11,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Green head
    ctx.fillStyle = '#2daa41';

    ctx.beginPath();

    ctx.arc(
        head.x + 10,
        head.y + 10,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // ======================================
    // EYES
    // ======================================

    let eye1 = {
        x: head.x + 5,
        y: head.y + 5
    };


    let eye2 = {
        x: head.x + 15,
        y: head.y + 5
    };


    if (direction.x === 1) {

        eye1 = {
            x: head.x + 15,
            y: head.y + 5
        };

        eye2 = {
            x: head.x + 15,
            y: head.y + 15
        };

    } else if (
        direction.x === -1
    ) {

        eye1 = {
            x: head.x + 5,
            y: head.y + 5
        };

        eye2 = {
            x: head.x + 5,
            y: head.y + 15
        };

    } else if (
        direction.y === 1
    ) {

        eye1 = {
            x: head.x + 5,
            y: head.y + 15
        };

        eye2 = {
            x: head.x + 15,
            y: head.y + 15
        };

    }


    // ======================================
    // DRAW EYES
    // ======================================

    [eye1, eye2].forEach(
        eye => {

            // White
            ctx.fillStyle = '#ffffff';

            ctx.beginPath();

            ctx.arc(
                eye.x,
                eye.y,
                3.5,
                0,
                Math.PI * 2
            );

            ctx.fill();


            // Pupil
            ctx.fillStyle = '#000000';

            ctx.beginPath();

            ctx.arc(
                eye.x,
                eye.y,
                1.8,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );

}


// ==========================================
// OVERLAY
// ==========================================

function showOverlay(
    title,
    subtitle,
    action
) {

    overlayTitle.textContent =
        title;


    overlaySubtitle.textContent =
        subtitle;


    overlayAction.textContent =
        action;


    overlay.style.display =
        'flex';

}


function hideOverlay() {

    overlay.style.display =
        'none';

}


// ==========================================
// MAIN GAME LOOP
// ==========================================

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }


    const dt =
        timestamp - lastTime;


    lastTime = timestamp;


    // ======================================
    // GAME UPDATE
    // ======================================

    if (
        gameState === 'PLAYING'
    ) {

        moveTimer += dt;


        // Big food spawn
        if (
            !bigFood &&
            Math.random() <
                BIG_FOOD_CHANCE
        ) {

            bigFood =
                newBigFood();


            if (bigFood) {

                bigFoodTimer =
                    BIG_FOOD_DURATION;
            }
        }


        // Big food timer
        if (bigFood) {

            bigFoodTimer -= dt;


            if (
                bigFoodTimer <= 0
            ) {

                bigFood = null;

                bigFoodTimer = 0;
            }
        }


        // Snake movement
        const delay =
            1000 / speed;


        if (
            moveTimer >= delay
        ) {

            moveTimer = 0;

            moveSnake();
        }

    }


    // ======================================
    // DRAW
    // ======================================

    drawBackground();

    drawFood();

    drawBigFood();

    drawEatEffect(dt);


    if (
        gameState !== 'MENU'
    ) {

        drawSnake();
    }


    requestAnimationFrame(
        gameLoop
    );

}


// ==========================================
// START
// ==========================================

requestAnimationFrame(
    gameLoop
);
