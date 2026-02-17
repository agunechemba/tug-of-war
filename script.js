const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* --- GAME STATE --- */
let ropePosition = 0;
let seconds = 0;
let timerInterval;
let gameRunning = false; // only true after Start button

/* --- QUESTIONS --- */
function generateQuestion() {
  const ops = ["+", "-", "*", "/"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a = Math.floor(Math.random() * 10) + 1;
  let b = Math.floor(Math.random() * 10) + 1;

  if (op === "/") a = a * b;

  const correct = eval(`${a} ${op} ${b}`);

  const options = new Set();
  options.add(correct);

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

let leftQ, rightQ;

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

/* --- SUBMIT ANSWER --- */
function submitAnswer(side, value) {
  if (!gameRunning) return; // ignore clicks before Start

  if (side === "left" && value === leftQ.correct) ropePosition -= 10;
  if (side === "right" && value === rightQ.correct) ropePosition += 10;

  checkWin();
  newQuestions();
}

/* --- WINNER MODAL --- */
function showWinner(text) {
  gameRunning = false; // stop game until restart
  document.getElementById("winText").textContent = `${text} (Time: ${seconds}s)`;
  document.getElementById("winModal").classList.add("active");
}

function closeModal() {
  document.getElementById("winModal").classList.remove("active");
  ropePosition = 0;
  resetTimer();
  document.getElementById("startBtn").style.display = "inline-block"; // show Start button
}

/* --- CHECK WIN --- */
function checkWin() {
  if (ropePosition <= -100) showWinner("Left Player Wins!");
  if (ropePosition >= 100) showWinner("Right Player Wins!");
}

/* --- TIMER --- */
function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `Time: ${seconds}s`;
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").textContent = `Time: ${seconds}s`;
}

/* --- START BUTTON --- */
const startBtn = document.getElementById("startBtn");
startBtn.addEventListener("click", () => {
  startBtn.style.display = "none"; // hide start
  gameRunning = true;
  newQuestions(); // generate first questions
  draw();         // start animation
  startTimer();   // start timer
});

/* --- DRAWING CANVAS --- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  drawBackground(centerY);

  const ropeX = centerX + ropePosition * 2;

  drawRope(ropeX, centerY);

  drawRealisticChild(ropeX - 150, centerY, true);
  drawRealisticChild(ropeX + 150, centerY, false);

  requestAnimationFrame(draw);
}

function drawBackground(groundY) {
  ctx.fillStyle = "#6ecb63";
  ctx.fillRect(0, groundY + 40, canvas.width, canvas.height);

  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 40);
  ctx.lineTo(canvas.width, groundY + 40);
  ctx.stroke();
}

function drawRope(x, y) {
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#b08968";

  ctx.beginPath();
  ctx.moveTo(x - 140, y);
  ctx.lineTo(x + 140, y);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#7f5539";

  for (let i = -120; i <= 120; i += 20) {
    ctx.beginPath();
    ctx.moveTo(x + i, y - 4);
    ctx.lineTo(x + i + 10, y + 4);
    ctx.stroke();
  }
}

function drawRealisticChild(x, y, isLeft) {
  const skin = "#f1c27d";

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y - 55, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#222";
  ctx.fillRect(x - 20, y - 70, 40, 15);

  ctx.fillStyle = isLeft ? "#ff6b6b" : "#4d96ff";
  ctx.fillRect(x - 18, y - 35, 36, 50);

  ctx.fillStyle = skin;
  ctx.fillRect(x - 28, y - 35, 10, 45);
  ctx.fillRect(x + 18, y - 35, 10, 45);

  ctx.strokeStyle = skin;
  ctx.lineWidth = 10;

  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x + 10, y - 10);
    ctx.lineTo(x + 55, y);
  } else {
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x - 55, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.fillRect(x - 18, y + 15, 14, 40);
  ctx.fillRect(x + 4, y + 15, 14, 40);

  ctx.fillStyle = "#111";
  ctx.fillRect(x - 20, y + 55, 18, 8);
  ctx.fillRect(x + 4, y + 55, 18, 8);
}
