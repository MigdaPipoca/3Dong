// Game constants
const GAME_W = 800, GAME_H = 400;
const PADDLE_W = 16, PADDLE_H = 90, PADDLE_MARGIN = 24;
const BALL_SIZE = 22;
const PADDLE_SPEED = 6;
const BALL_SPEED = 5.6, BALL_SPEEDUP = 1.01, MAX_BALL_SPEED = 14;

// Elements
const leftPaddleElem = document.getElementById('paddle-left');
const rightPaddleElem = document.getElementById('paddle-right');
const ballElem = document.getElementById('ball');
const scoreLeftElem = document.getElementById('score-left');
const scoreRightElem = document.getElementById('score-right');

// State
let leftPaddleY = GAME_H / 2 - PADDLE_H / 2;
let rightPaddleY = GAME_H / 2 - PADDLE_H / 2;
let leftScore = 0, rightScore = 0;

let keys = { ArrowUp: false, ArrowDown: false };

let ball = {
  x: GAME_W / 2 - BALL_SIZE / 2,
  y: GAME_H / 2 - BALL_SIZE / 2,
  vx: 0,
  vy: 0,
  speed: BALL_SPEED,
};

// AI state variables
let aiMode = 'chase'; // 'chase' or 'random'
let aiTimer = 2000; // ms left in current mode
let aiRandomTargetY = GAME_H / 2 - PADDLE_H / 2;

// Reset ball to center with random direction
function resetBall(serveLeft = true) {
  ball.x = GAME_W / 2 - BALL_SIZE / 2;
  ball.y = Math.random() * (GAME_H - BALL_SIZE - 80) + 40;
  const angle = (Math.random() * 0.6 - 0.3) + (serveLeft ? Math.PI : 0);
  ball.speed = BALL_SPEED;
  ball.vx = (serveLeft ? 1 : -1) * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

resetBall();

// Drawing paddles and ball
function draw() {
  leftPaddleElem.style.top = leftPaddleY + 'px';
  rightPaddleElem.style.top = rightPaddleY + 'px';
  ballElem.style.left = ball.x + 'px';
  ballElem.style.top = ball.y + 'px';
}

// Keyboard input
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') keys[e.key] = false;
});

// Mouse input: paddle follows Y position
document.getElementById('pong3d').addEventListener('mousemove', e => {
  let rect = e.target.getBoundingClientRect();
  let y = e.clientY - rect.top - PADDLE_H / 2;
  // Clamp between 0 and (GAME_H-PADDLE_H)
  leftPaddleY = Math.min(Math.max(y, 0), GAME_H - PADDLE_H);
});

// Improved AI for right paddle
function aiMove(dt) {
  aiTimer -= dt;
  if (aiTimer <= 0) {
    if (aiMode === 'chase') {
      aiMode = 'random';
      aiTimer = 1000; // 1 sec
      aiRandomTargetY = Math.random() * (GAME_H - PADDLE_H);
    } else {
      aiMode = 'chase';
      aiTimer = 2000; // 2 sec
    }
  }

  let targetY =
    aiMode === 'chase'
      ? ball.y - PADDLE_H / 2 + BALL_SIZE / 2
      : aiRandomTargetY;

  if (rightPaddleY + PADDLE_H / 2 < targetY) {
    rightPaddleY += Math.min(
      PADDLE_SPEED * 0.82,
      Math.abs(targetY - rightPaddleY) * 0.12 + 2.5
    );
  } else if (rightPaddleY + PADDLE_H / 2 > targetY) {
    rightPaddleY -= Math.min(
      PADDLE_SPEED * 0.82,
      Math.abs(targetY - rightPaddleY) * 0.12 + 2.5
    );
  }

  // Clamp
  rightPaddleY = Math.max(0, Math.min(GAME_H - PADDLE_H, rightPaddleY));
}

// Game loop with time delta
let lastTime = performance.now();

function gameLoop() {
  // Keyboard movement (arrows override mouse)
  if (keys.ArrowUp) leftPaddleY -= PADDLE_SPEED;
  if (keys.ArrowDown) leftPaddleY += PADDLE_SPEED;
  leftPaddleY = Math.max(0, Math.min(GAME_H - PADDLE_H, leftPaddleY));

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions (top/bottom)
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy *= -1;
  }
  if (ball.y > GAME_H - BALL_SIZE) {
    ball.y = GAME_H - BALL_SIZE;
    ball.vy *= -1;
  }

  // Paddle collisions (left)
  if (
    ball.x <= PADDLE_MARGIN + PADDLE_W &&
    ball.y + BALL_SIZE >= leftPaddleY &&
    ball.y <= leftPaddleY + PADDLE_H
  ) {
    ball.x = PADDLE_MARGIN + PADDLE_W + 1;
    let relativeIntersectY =
      leftPaddleY + PADDLE_H / 2 - (ball.y + BALL_SIZE / 2);
    let norm = relativeIntersectY / (PADDLE_H / 2);
    let bounceAngle = norm * (Math.PI / 4); // 45deg max
    ball.speed = Math.min(ball.speed * BALL_SPEEDUP, MAX_BALL_SPEED);
    ball.vx = ball.speed * Math.cos(bounceAngle);
    ball.vy = -ball.speed * Math.sin(bounceAngle);
  }

  // Paddle collisions (right/AI)
  if (
    ball.x + BALL_SIZE >= GAME_W - (PADDLE_MARGIN + PADDLE_W) &&
    ball.y + BALL_SIZE >= rightPaddleY &&
    ball.y <= rightPaddleY + PADDLE_H
  ) {
    ball.x = GAME_W - (PADDLE_MARGIN + PADDLE_W) - BALL_SIZE - 1;
    let relativeIntersectY =
      rightPaddleY + PADDLE_H / 2 - (ball.y + BALL_SIZE / 2);
    let norm = relativeIntersectY / (PADDLE_H / 2);
    let bounceAngle = norm * (Math.PI / 4);
    ball.speed = Math.min(ball.speed * BALL_SPEEDUP, MAX_BALL_SPEED);
    ball.vx = -ball.speed * Math.cos(bounceAngle);
    ball.vy = -ball.speed * Math.sin(bounceAngle);
  }

  // Score (left/right walls passed)
  if (ball.x < -BALL_SIZE) {
    rightScore++;
    scoreRightElem.textContent = rightScore;
    resetBall(true);
    // on reset, ensure AI state resets smoothly too
    aiMode = 'chase';
    aiTimer = 2000;
  }
  if (ball.x > GAME_W) {
    leftScore++;
    scoreLeftElem.textContent = leftScore;
    resetBall(false);
    aiMode = 'chase';
    aiTimer = 2000;
  }

  let now = performance.now();
  let dt = now - lastTime;
  lastTime = now;

  aiMove(dt);

  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();