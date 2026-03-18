// description: This example demonstrates how to use a Container to group and manipulate multiple sprites
import { Application, Assets, Container, Sprite } from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#066b66', resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Load textures
  const squirrelTexture = await Assets.load('/assets/squirrel.png');
  const squirrelFlyTexture = await Assets.load('/assets/squirrel2.png');
  const wallTexture = await Assets.load('/assets/wall.png');

  // Create player
  const squirrel = new Sprite(squirrelTexture);
  squirrel.width = 100;
  squirrel.height = 50;
  squirrel.anchor.set(0.5);
  squirrel.x = app.screen.width / 4;
  squirrel.y = app.screen.height / 4;
  app.stage.addChild(squirrel);

  // Wall (top and bottom)
  const wallTop = new Sprite(wallTexture);
  const wallBottom = new Sprite(wallTexture);

  wallTop.anchor.set(0, 0);
  wallBottom.anchor.set(0, 0);

  app.stage.addChild(wallTop);
  app.stage.addChild(wallBottom);

  // Game variables
  let wallX = app.screen.width;
  let dx = -1.5;

  let playerY = squirrel.y;
  let dy = 0;
  let accelY = 0.01;

  let Fly = false;
  let Score = 0;
  let finished = false;

  const gapSize = 140; // constant distance between top and bottom

  let selectedWall = 0;

  let topGap = 0;
  let bottomGap = 0;

  function selectWall() {
    const minTop = 50; // minimum space from top
    const maxTop = app.screen.height - gapSize - 50; // keep within screen

    topGap = Math.random() * (maxTop - minTop) + minTop;
    bottomGap = topGap + gapSize;
  }

  function respawnWall() {
    wallX = app.screen.width;
    Score += 1;
    if (Score % 5 === 0) dx -= 0.25;
    selectWall();
  }

  // Initial wall
  selectWall();

  // Game loop
  app.ticker.add(() => {
    if (finished) return;

    // Physics
    accelY = Fly ? -0.05 : 0.02;
    dy += accelY;
    playerY += dy;

    squirrel.y = playerY;

    // Animate sprite
    squirrel.texture = Fly ? squirrelFlyTexture : squirrelTexture;

    // Wall movement
    wallX += dx;

    // const topGap = gaps[selectedWall][0];
    // const bottomGap = gaps[selectedWall][1];

    // Top wall
    wallTop.x = wallX;
    wallTop.y = 0;
    wallTop.width = 50;
    wallTop.height = topGap;

    // Bottom wall
    wallBottom.x = wallX;
    wallBottom.y = bottomGap;
    wallBottom.width = 50;
    wallBottom.height = app.screen.height - bottomGap;

    // Respawn
    if (wallX < -50) {
      respawnWall();
    }

    const margin = 5; // pixels of forgiveness
    // Player bounds (shrunk)
    const playerLeft = squirrel.x - squirrel.width / 2 + margin;
    const playerRight = squirrel.x + squirrel.width / 2 - margin;
    const playerTop = squirrel.y - squirrel.height / 2 + margin;
    const playerBottom = squirrel.y + squirrel.height / 2 - margin;

    // Wall bounds
    const wallLeft = wallX;
    const wallRight = wallX + 50;

    // Horizontal overlap
    const horizontalOverlap = playerRight > wallLeft && playerLeft < wallRight;

    if (horizontalOverlap) {
      if (playerTop < topGap || playerBottom > bottomGap) {
        finished = true;
        console.log("Game Over! Collided with Wall. Score:", Score);
      }
    }

    // Ground collision
    if (playerBottom > app.screen.height) {
      finished = true;
      console.log("Game Over! Collided with Ground. Score:", Score);
    }

  });

  /*
  *
  *INPUT HANDLERZ
  *KEYBOARD & TOCUH
  * 
  */

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') Fly = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp') Fly = false;
  });

  // Touch
  window.addEventListener('touchstart', () => {
    Fly = true;
  });

  window.addEventListener('touchend', () => {
    Fly = false;
  });

})();
