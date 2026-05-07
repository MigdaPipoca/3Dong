// --- Place these at the top with other variables ---
let aiMode = 'chase'; // 'chase' or 'random'
let aiTimer = 0;
let aiRandomTargetY = GAME_H / 2 - PADDLE_H / 2;

// --- Replace your aiMove() function with this one: ---
function aiMove(dt) {
  aiTimer -= dt;
  if (aiTimer <= 0) {
    if (aiMode === 'chase') {
      aiMode = 'random';
      aiTimer = 1000; // 1 second in ms
      aiRandomTargetY = Math.random() * (GAME_H - PADDLE_H);
    } else {
      aiMode = 'chase';
      aiTimer = 2000; // 2 seconds in ms
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

// --- In your main loop, add a time measurement and pass dt to aiMove ---
// Replace the end of your file with this:
let lastTime = performance.now();

function gameLoop() {
  // ...
  // (everything in your gameLoop except aiMove)
  
  let now = performance.now();
  let dt = now - lastTime;
  lastTime = now;

  aiMove(dt);

  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();