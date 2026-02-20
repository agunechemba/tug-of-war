const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const welcomeBox = document.getElementById("welcomeBox");
const celebration = document.getElementById("celebration");
const celebrationText = document.getElementById("celebrationText");

let ropePosition = 0; 
let pullOffset = 0; // For "jerking" animation when pulling
let seconds = 0;
let gameRunning = false;
let leftLives = 5, rightLives = 5;
const MAX_LIVES = 10;
let timerInterval, leftQ, rightQ;

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* --- MATH ENGINE --- */
function generateQuestion() {
    const ops = ["+", "-", "*", "/"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, correct;

    if (op === "/") {
        b = Math.floor(Math.random() * 9) + 1;
        correct = Math.floor(Math.random() * 9) + 1;
        a = b * correct;
    } else if (op === "*") {
        a = Math.floor(Math.random() * 11) + 1;
        b = Math.floor(Math.random() * 11) + 1;
        correct = a * b;
    } else {
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        correct = op === "+" ? a + b : a - b;
    }

    const options = new Set([correct]);
    while (options.size < 4) {
        const wrong = correct + (Math.floor(Math.random() * 10) - 5);
        if (wrong !== correct) options.add(wrong);
    }
    return {
        q: `${a} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${b}`,
        correct,
        options: Array.from(options).sort(() => Math.random() - 0.5)
    };
}

/* --- GAME ACTIONS --- */
function submitAnswer(side, val) {
    if (!gameRunning) return;
    const q = side === "left" ? leftQ : rightQ;

    if (val === q.correct) {
        pullOffset = side === "left" ? -15 : 15; // Animation jerk
        ropePosition += pullOffset;
        if (side === "left") { if(leftLives < MAX_LIVES) leftLives++; }
        else { if(rightLives < MAX_LIVES) rightLives++; }
    } else {
        if (side === "left") leftLives--; else rightLives--;
        triggerShake(side + "Panel");
    }

    updateLivesUI();
    if (!checkWin()) {
        setTimeout(() => pullOffset = 0, 100); // Reset jerk
        newQuestions();
    }
}

function checkWin() {
    let winner = "";
    if (ropePosition <= -150 || rightLives <= 0) winner = "Left Player";
    else if (ropePosition >= 150 || leftLives <= 0) winner = "Right Player";

    if (winner) {
        gameRunning = false;
        clearInterval(timerInterval);
        showCelebration(winner);
        return true;
    }
    return false;
}

function showCelebration(name) {
    celebrationText.textContent = `${name.toUpperCase()} WINS!`;
    celebrationText.style.color = name.includes("Left") ? "#2ecc71" : "#3498db";
    celebration.style.display = "flex";
    
    setTimeout(() => {
        celebration.style.display = "none";
        document.getElementById("winText").textContent = winnerResult(name);
        document.getElementById("winModal").classList.add("active");
    }, 3000);
}

function winnerResult(name) {
    return `${name} dominated the field in ${seconds} seconds!`;
}

/* --- RENDERING --- */
function draw() {
    if (!gameRunning && celebration.style.display === "none") return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerY = canvas.height / 2;
    const ropeX = (canvas.width / 2) + ropePosition + (pullOffset * 0.5);

    // Ground & Shadows
    ctx.fillStyle = "#5cb85c";
    ctx.fillRect(0, centerY + 50, canvas.width, canvas.height);
    
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(ropeX - 140, centerY + 65, 30, 10, 0, 0, Math.PI*2);
    ctx.ellipse(ropeX + 140, centerY + 65, 30, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // Rope
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#8d6e63";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ropeX - 220, centerY + 15);
    ctx.lineTo(ropeX + 220, centerY + 15);
    ctx.stroke();

    drawPlayer(ropeX - 140, centerY + 15, true);
    drawPlayer(ropeX + 140, centerY + 15, false);

    requestAnimationFrame(draw);
}

function drawPlayer(x, y, isLeft) {
    const skin = "#ffdbac";
    const hair = isLeft ? "#4b2c20" : "#f1c40f";
    const pullSide = isLeft ? 1 : -1;

    // Body
    ctx.fillStyle = isLeft ? "#e74c3c" : "#3498db";
    ctx.beginPath();
    ctx.roundRect(x - 20, y - 45, 40, 65, 10);
    ctx.fill();

    // Head & Hair
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(x, y - 70, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(x, y - 78, 23, Math.PI, 0); ctx.fill();

    // Face Details
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.arc(x - 7, y - 72, 2.5, 0, Math.PI*2); ctx.arc(x + 7, y - 72, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 62, 5, 0.5, Math.PI-0.5); ctx.stroke();

    // Arms (Holding Rope)
    ctx.strokeStyle = skin; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + (pullSide * 5), y - 20);
    ctx.lineTo(x + (pullSide * 50), y);
    ctx.stroke();

    // Legs
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(x - 16, y + 20, 12, 45); ctx.fillRect(x + 4, y + 20, 12, 45);
}

/* --- UTILS --- */
function updateLivesUI() {
    document.getElementById("leftLives").textContent = "❤️".repeat(leftLives);
    document.getElementById("rightLives").textContent = "❤️".repeat(rightLives);
}

function triggerShake(id) {
    const p = document.getElementById(id);
    p.classList.add("shake");
    setTimeout(() => p.classList.remove("shake"), 400);
}

function newQuestions() {
    leftQ = generateQuestion(); rightQ = generateQuestion();
    document.getElementById("leftQuestion").textContent = leftQ.q;
    document.getElementById("rightQuestion").textContent = rightQ.q;
    renderOptions("leftOptions", leftQ, "left");
    renderOptions("rightOptions", rightQ, "right");
}

function renderOptions(id, obj, side) {
    const c = document.getElementById(id); c.innerHTML = "";
    obj.options.forEach(o => {
        const b = document.createElement("button");
        b.className = `option-btn ${side}-option`;
        b.textContent = o;
        b.onclick = () => submitAnswer(side, o);
        c.appendChild(b);
    });
}

document.getElementById("startBtn").onclick = () => {
    welcomeBox.style.display = "none";
    gameRunning = true;
    leftLives = 5; rightLives = 5; ropePosition = 0; seconds = 0;
    updateLivesUI(); newQuestions(); draw();
    timerInterval = setInterval(() => { seconds++; document.getElementById("timer").textContent = `Time: ${seconds}s`; }, 1000);
};

function closeModal() {
    document.getElementById("winModal").classList.remove("active");
    welcomeBox.style.display = "block";
    document.getElementById("timer").textContent = "Time: 0s";
}