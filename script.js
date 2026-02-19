const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const welcomeBox = document.getElementById("welcomeBox");

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* --- GAME STATE --- */
let ropePosition = 0; // Negative = Left pulling, Positive = Right pulling
let seconds = 0;
let timerInterval;
let gameRunning = false; 
let leftLives = 5;
let rightLives = 5;
const MAX_LIVES = 5;
let leftQ, rightQ;

/* --- UI UPDATES --- */
function updateLivesUI() {
  document.getElementById("leftLives").textContent = "❤️".repeat(leftLives);
  document.getElementById("rightLives").textContent = "❤️".repeat(rightLives);
}

/* --- MATH LOGIC --- */
function generateQuestion() {
  const ops = ["+", "-", "*"]; // Using addition, subtraction, multiplication
  const op = ops[Math.floor(Math.random() * ops.length)];
  
  let a = Math.floor(Math.random() * 12) + 1;
  let b = Math.floor(Math.random() * 12) + 1;
  
  const correct = eval(`${a} ${op} ${b}`);
  
  const options = new Set([correct]);
  while (options.size < 4) {
    const wrong = correct + Math.floor(Math.random() * 10 - 5);
    if (wrong !== correct) options.add(wrong);
  }
  
  return { 
    q: `${a} ${op} ${b}`, 
    correct, 
    options: Array.from(options).sort(() => Math.random() - 0.5) 
  };
}

function renderOptions(containerId, questionObj, side) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  questionObj.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = `option-btn ${side === 'left' ? 'left-option' : 'right-option'}`;
    btn.textContent = opt;
    btn.onclick = () => submitAnswer(side, opt);
    container.appendChild(btn);
  });
}

function newQuestions() {
  leftQ = generateQuestion();
  rightQ = generateQuestion();
  document.getElementById("leftQuestion").textContent = leftQ.q;
  document.getElementById("rightQuestion").textContent = rightQ.q;
  renderOptions("leftOptions", leftQ, "left");
  renderOptions("rightOptions", rightQ, "right");
}

/* --- CORE GAME LOGIC --- */
function submitAnswer(side, value) {
  if (!gameRunning) return;

  if (side === "left") {
    if (value === leftQ.correct) { 
      ropePosition -= 25; // Pull rope left
    } else { 
      leftLives--; 
      triggerShake("leftPanel"); 
    }
  } else {
    if (value === rightQ.correct) { 
      ropePosition += 25; // Pull rope right
    } else { 
      rightLives--; 
      triggerShake("rightPanel"); 
    }
  }

  updateLivesUI();
  if (!checkWin()) {
    newQuestions();
  }
}

function triggerShake(panelId) {
  const panel = document.getElementById(panelId);
  panel.classList.add("shake");
  setTimeout(() => panel.classList.remove("shake"), 400);
}

function checkWin() {
  let winner = "";
  // Win by pulling distance
  if (ropePosition <= -150) winner = "Left Player Wins by Power!";
  else if (ropePosition >= 150) winner = "Right Player Wins by Power!";
  // Win by life depletion
  else if (leftLives <= 0) winner = "Right Player Wins! Left lost all lives.";
  else if (rightLives <= 0) winner = "Left Player Wins! Right lost all lives.";

  if (winner) {
    showWinner(winner);
    return true;
  }
  return false;
}

function showWinner(text) {
  gameRunning = false;
  clearInterval(timerInterval);
  document.getElementById("winText").textContent = `${text} (Time: ${seconds}s)`;
  document.getElementById("winModal").classList.add("active");
}

function closeModal() {
  document.getElementById("winModal").classList.remove("active");
  welcomeBox.style.display = "block";
  ropePosition = 0;
  resetTimer();
}

function resetTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").textContent = `Time: 0s`;
}

/* --- START EVENT --- */
document.getElementById("startBtn").addEventListener("click", () => {
  welcomeBox.style.display = "none";
  gameRunning = true;
  leftLives = MAX_LIVES;
  rightLives = MAX_LIVES;
  ropePosition = 0;
  updateLivesUI();
  newQuestions();
  startTimer();
  draw();
});

function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `Time: ${seconds}s`;
  }, 1000);
}

/* --- ENHANCED CANVAS DRAWING --- */
function draw() {
  if (!gameRunning && !document.getElementById("winModal").classList.contains("active")) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // 1. Draw Grass
  ctx.fillStyle = "#5cb85c";
  ctx.fillRect(0, centerY + 40, canvas.width, canvas.height);

  // 2. Draw Ground Shadows
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  const ropeX = centerX + ropePosition;
  
  // Shadows under children
  ctx.beginPath();
  ctx.ellipse(ropeX - 150, centerY + 60, 35, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ropeX + 150, centerY + 60, 35, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Draw Rope
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#8d6e63"; 
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ropeX - 200, centerY);
  ctx.lineTo(ropeX + 200, centerY);
  ctx.stroke();

  // Draw players
  drawRealisticChild(ropeX - 150, centerY, true);
  drawRealisticChild(ropeX + 150, centerY, false);

  requestAnimationFrame(draw);
}

function drawRealisticChild(x, y, isLeft) {
  const skin = "#ffdbac";
  const shirtColor = isLeft ? "#e74c3c" : "#3498db";
  const pantsColor = "#2c3e50";
  const hairColor = isLeft ? "#4b2c20" : "#f1c40f"; 

  // Legs
  ctx.fillStyle = pantsColor;
  ctx.fillRect(x - 15, y + 15, 12, 40); 
  ctx.fillRect(x + 3, y + 15, 12, 40);  
  
  // Shoes
  ctx.fillStyle = "#333";
  ctx.fillRect(x - 18, y + 55, 16, 8);  
  ctx.fillRect(x + 2, y + 55, 16, 8);   

  // Shirt
  ctx.fillStyle = shirtColor;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x - 20, y - 35, 40, 55, 8);
    ctx.fill();
  } else {
    ctx.fillRect(x - 20, y - 35, 40, 55); // Fallback for older browsers
  }

  // Arms (holding rope)
  ctx.strokeStyle = skin;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x + 5, y - 10);
    ctx.lineTo(x + 55, y); 
  } else {
    ctx.moveTo(x - 5, y - 10);
    ctx.lineTo(x - 55, y); 
  }
  ctx.stroke();

  // Head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y - 60, 22, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  if (isLeft) {
    ctx.arc(x, y - 65, 23, Math.PI, 0); // Bowl/Cap cut
  } else {
    ctx.moveTo(x - 25, y - 60);
    ctx.quadraticCurveTo(x, y - 95, x + 25, y - 60); // Spiky hair
  }
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(x - 7, y - 62, 2.5, 0, Math.PI * 2); 
  ctx.arc(x + 7, y - 62, 2.5, 0, Math.PI * 2); 
  ctx.fill();
  
  // Mouth (strained expression)
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 50, 6, 0.5, Math.PI - 0.5); 
  ctx.stroke();
}