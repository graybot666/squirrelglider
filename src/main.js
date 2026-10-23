import { Application, Assets, Text, TextStyle, Container, Graphics, Sprite } from 'pixi.js';

(async () => {

  // Virtual / Logical Game Resolution (Consistent across Desktop and Mobile)
  const GAME_WIDTH = 450;
  const GAME_HEIGHT = 750;

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
  const gravity = 0.1;
  const maxFallSpeed = 2.5;
  const jumpStrength = -3;
  
  // Pixels of forgiveness - used to calculate player bounds
  const playerErrorMargin = 8;

  // Create a new application
  const app = new Application();

  // Initialize the application with fixed logical size and crisp DPI scaling
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: '#90fff9',
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Load textures
  const baseUrl = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/');
  const squirrelTexture = await Assets.load(`${baseUrl}assets/squirrel.png`);
  const squirrelFlyTexture = await Assets.load(`${baseUrl}assets/squirrel2.png`);
  const wallTexture = await Assets.load(`${baseUrl}assets/wall.png`);

  const scoreKey = "SQGL_HIGHSCORE";
  let localHighscore = Number(localStorage.getItem(scoreKey)) || 0;

  //Text Styles
  const titleStyle = new TextStyle({
    fontSize: 30,
    align: "center",
    fontFamily: "Tahoma, sans-serif",
    fill: "#000000"
  });

  const uiStyle = new TextStyle({
    fontSize: 20,
    align: "center",
    fontFamily: "Serif, sans-serif",
    fill: "#ffffff",
    stroke: "#1b1b1b",
    strokeThickness: 4
  });

  // Start Screen UI
  const uiContainer = new Container();
  app.stage.addChild(uiContainer);

  const titleText = new Text({
    text: "Squirrel Glider\n\nPlayer's High Score: "+localHighscore,
    style: titleStyle
  });

  titleText.anchor.set(0.5);
  titleText.x = GAME_WIDTH / 2;
  titleText.y = GAME_HEIGHT / 4;

  uiContainer.addChild(titleText);
  uiContainer.visible = true;

  // Button & Button text
  const button = new Graphics();
  button.beginFill(0x00aa00);
  button.drawRoundedRect(0, 0, 200, 60, 10);
  button.endFill();

  button.x = GAME_WIDTH / 2 - 100;
  button.y = GAME_HEIGHT / 1.3;
  button.eventMode = 'static';
  button.cursor = 'pointer';

  const buttonText = new Text({
    text: "Start",
    style: new TextStyle(uiStyle)
  });
  buttonText.anchor.set(0.5);
  buttonText.x = button.x + 100;
  buttonText.y = button.y + 30;

  uiContainer.addChild(button);
  uiContainer.addChild(buttonText);

  // Create squirrel
  const squirrel = new Sprite(squirrelTexture);
  squirrel.width = 90;
  squirrel.height = 45;
  squirrel.anchor.set(0.5);
  squirrel.x = GAME_WIDTH / 4;
  squirrel.y = GAME_HEIGHT / 4;
  app.stage.addChild(squirrel);

  // Wall (top and bottom)
  const wallTop = new Sprite(wallTexture);
  const wallBottom = new Sprite(wallTexture);
  wallTop.anchor.set(0, 0);
  wallBottom.anchor.set(0, 0);
  app.stage.addChild(wallTop);
  app.stage.addChild(wallBottom);

  let wallX = GAME_WIDTH;
  let playerY = squirrel.y;

  //Hide walls & squirrel at start
  squirrel.visible = false;
  wallTop.visible = false;
  wallBottom.visible = false;

  // Score UI Container
  const scoreContainer = new Container();
  app.stage.addChild(scoreContainer);

  const scoreText = new Text({
    style: uiStyle
  });

  scoreText.anchor.set(0.5);
  scoreText.x = GAME_WIDTH / 2;
  scoreText.y = 45;

  scoreContainer.addChild(scoreText);

  function selectWall() {
    const minTop = 50; // minimum space from top
    const maxTop = GAME_HEIGHT - gapSize - 50; // keep within screen

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
    wallX = GAME_WIDTH;
    Score += 1;
    selectWall();

    //Update Score UI
    scoreText.text = Score.toString();

    if (Score % 5 === 0)
      dx -= 0.25;
  }

  function startGame() {
    gameState = "playing";
    finished = false;

    // Show Score Text
    scoreText.text = "0";
    scoreContainer.visible = true;

    // Reset UI text
    titleText.text = "Squirrel Glider";
    uiContainer.visible = false;

    //Setup Initial Values
    playerY = GAME_HEIGHT / 2;
    dy = 0;
    Score = 0;
    wallX = GAME_WIDTH;
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
    titleText.style = titleStyle;
    uiContainer.visible = true;
    scoreContainer.visible = false;

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
    wallBottom.height = GAME_HEIGHT - bottomGap;

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
      }
    }

    // Ground Collision
    if (playerBottom > GAME_HEIGHT) {
      finished = true;
    }

    // Sky Collision
    if (playerTop < 0) {
      finished = true;
    }

  });

  /*
  *
  * INPUT HANDLERS (Cross-Platform: Desktop Mouse/Keyboard & Mobile Touch)
  * 
  */

  // Start Button (Pointerdown handles both mouse clicks and touch taps)
  button.on('pointerdown', (e) => {
    e.stopPropagation?.();
    startGame();
  });

  // Screen Taps / Clicks (Flap during gameplay on desktop or mobile)
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointerdown', () => {
    if (gameState === "playing") {
      flap();
    }
  });

  // Desktop Keyboard (ArrowUp & Spacebar)
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'ArrowUp' || e.code === 'Space') && !e.repeat) {
      e.preventDefault();
      flap();
    }
  });

  // Mobile Touch optimization (Prevents browser bounce / zoom / rubber-banding)
  app.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });

  app.canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

})();
