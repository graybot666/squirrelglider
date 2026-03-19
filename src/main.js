import { Application, Assets, Text, TextStyle, Container, Graphics, Sprite } from 'pixi.js';

(async () => {

  // State Variables
  let gameState = "start"; // "start" | "playing" | "gameover"
  let endText = "";
  let finished = false;

  //Wall Sizing
  const gapSize = 140; // constant distance between top and bottom
  let topGap = 0;
  let bottomGap = 0;

  //Game Variables
  let dx = 0;
  let dy = 0;
  let Score = 0;

  //Jump Settings
  const gravity = 0.01;
  const maxFallSpeed = 0.5;
  const jumpStrength = -0.5;
  
  // Pixels of forgiveness - used to calculate player bounds
  const playerErrorMargin = 5;

  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#90fff9', resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Load textures
  const squirrelTexture = await Assets.load('./assets/squirrel.png');
  const squirrelFlyTexture = await Assets.load('./assets/squirrel2.png');
  const wallTexture = await Assets.load('./assets/wall.png');

  const scoreKey = "SQGL_HIGHSCORE";
  let localHighscore = Number(localStorage.getItem(scoreKey)) || 0;

  const uiContainer = new Container();
  app.stage.addChild(uiContainer);

  // Title
  const titleStyle = new TextStyle({
    fontSize: 48,
    fill: "#000000"
  });

  const titleText = new Text({
    text: "Squirrel Glider\n\nHigh Score: "+localHighscore,
    style: titleStyle
  });

  titleText.anchor.set(0.5);
  titleText.x = app.screen.width / 2;
  titleText.y = app.screen.height / 4;

  uiContainer.addChild(titleText);

  // Button
  const button = new Graphics();
  button.beginFill(0x00aa00);
  button.drawRoundedRect(0, 0, 200, 60, 10);
  button.endFill();

  button.x = app.screen.width / 2 - 100;
  button.y = app.screen.height / 1.3;

  button.eventMode = 'static';
  button.cursor = 'pointer';

  // Button text
  const buttonText = new Text({
    text: "Start",
    style: new TextStyle({ fontSize: 24, fill: "#ffffff" })
  });

  buttonText.anchor.set(0.5);
  buttonText.x = button.x + 100;
  buttonText.y = button.y + 30;

  uiContainer.addChild(button);
  uiContainer.addChild(buttonText);

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

  let wallX = app.screen.width;
  let playerY = squirrel.y;

  //Hide walls & squirrel at start
  squirrel.visible = false;
  wallTop.visible = false;
  wallBottom.visible = false;

  function selectWall() {
    const minTop = 50; // minimum space from top
    const maxTop = app.screen.height - gapSize - 50; // keep within screen

    topGap = Math.random() * (maxTop - minTop) + minTop;
    bottomGap = topGap + gapSize;
  }

  function flap() {
    if (gameState !== "playing")
      return;

    dy = jumpStrength;
    squirrel.texture = squirrelFlyTexture;
  }

  function respawnWall() {
    wallX = app.screen.width;
    Score += 1;
    selectWall();

    if (Score % 5 === 0)
      dx -= 0.25;
  }

  function startGame() {
    gameState = "playing";
    finished = false;

    // Reset UI text
    titleText.text = "Squirrel Glider";
    uiContainer.visible = false;

    //Setup Initial Values
    playerY = app.screen.height / 2;
    dy = 0;
    Score = 0;
    wallX = app.screen.width;
    dx = -2.0;

    //Show walls & squirrel then start game
    selectWall();
    squirrel.visible = true;
    wallTop.visible = true;
    wallBottom.visible = true;
  }

  function showGameOver() {
    gameState = "gameover";

    //Update localHighscore if required
    if (localHighscore >= Score){
      endText = "Game Over\n\nScore: " + Score + "\nHigh Score: " + localHighscore;
    } else {
      localStorage.setItem(scoreKey, Score);
      localHighscore = Score;
      endText = "Game Over\n\nNew High Score: " + Score;
    }

    // Update UI text & show
    titleText.text = endText;
    uiContainer.visible = true;

    // Hide walls & squirrel
    squirrel.visible = false;
    wallTop.visible = false;
    wallBottom.visible = false;
  }

  // Game loop
  app.ticker.add(() => {
    if (gameState !== "playing") return;

    if (finished) {
      showGameOver();
      return;
    }

    // Physics - Constant gravity
    dy += gravity;
    dy = Math.min(dy, maxFallSpeed);
    dy = Math.max(dy, jumpStrength);
    playerY += dy;
    squirrel.y = playerY;

    // Wall movement
    wallX += dx;

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

    // Reset to normal texture when falling
    if (dy > 0) {
      squirrel.texture = squirrelTexture;
    }

    // Player bounds (shrunk)
    const playerLeft = squirrel.x - squirrel.width / 2 + playerErrorMargin;
    const playerRight = squirrel.x + squirrel.width / 2 - playerErrorMargin;
    const playerTop = squirrel.y - squirrel.height / 2 + playerErrorMargin;
    const playerBottom = squirrel.y + squirrel.height / 2 - playerErrorMargin;

    // Wall bounds
    const wallLeft = wallX;
    const wallRight = wallX + 50;

    // Wall Collision
    const horizontalOverlap = playerRight > wallLeft && playerLeft < wallRight;
    if (horizontalOverlap) {
      if (playerTop < topGap || playerBottom > bottomGap) {
        finished = true;
        // console.log("Game Over! Collided with Wall. Score:", Score);
      }
    }

    // Ground Collision
    if (playerBottom > app.screen.height) {
      finished = true;
      // console.log("Game Over! Collided with Ground. Score:", Score);
    }

    // Sky Collision
    if (playerTop < 0) {
      finished = true;
      // console.log("Game Over! Collided with Sky. Score:", Score);
    }

  });

  /*
  *
  *INPUT HANDLERZ
  *KEYBOARD & TOCUH
  * 
  */

  //Start Button
  button.on('pointerdown', () => {
    startGame();
  });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp' && !e.repeat) {
      flap();
    }
  });

  // Touch
  let touchActive = false;
  window.addEventListener('touchstart', () => {
    if (!touchActive) {
      flap();
      touchActive = true;
    }
  });

  window.addEventListener('touchend', () => {
    touchActive = false;
  });

})();
