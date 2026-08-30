// ============================================
// SHARED GAME ENGINE - Tug of War
// Supports both 2-player and vs AI modes
// ============================================

// --- DOM REFERENCES ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const welcomeBox = document.getElementById("welcomeBox");
const celebration = document.getElementById("celebration");
const celebrationText = document.getElementById("celebrationText");
const celebrationSubtext = document.getElementById("celebrationSubtext");

// --- GAME STATE ---
let ropePosition = 0;
let pullOffset = 0;
let seconds = 0;
let gameRunning = false;
let leftLives = 5, rightLives = 5;
let leftScore = 0, rightScore = 0;
let leftStreak = 0, rightStreak = 0;
const MAX_LIVES = 10;
let timerInterval, leftQ, rightQ;
let animationId = null;
let resizeTimeout = null;

// --- VISUAL EFFECTS ---
let leftPullStrength = 0;
let rightPullStrength = 0;
let shakeAmount = 0;
let particles = [];

// --- PLAYER SETTINGS ---
let leftPlayerName = "Player 1";
let rightPlayerName = "Player 2";
let leftPlayerColor = "#e74c3c";
let rightPlayerColor = "#3498db";
let difficulty = "medium";
let startingLives = 5;

// --- MODE DETECTION ---
const isAIMode = window.location.pathname.includes('playWithAI.html');

// --- AI STATE (only used in AI mode) ---
let aiThinkTimer = null;
let aiBusy = false;

// --- STATS ---
let gameStats = {
    left: { correct: 0, wrong: 0, avgTime: 0, totalTime: 0 },
    right: { correct: 0, wrong: 0, avgTime: 0, totalTime: 0 }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
});
resizeCanvas();

// ============================================
// MATH ENGINE
// ============================================

function generateQuestion() {
    let a, b, correct, op;
    const random = Math.random();

    switch(difficulty) {
        case "easy":
            const easyOps = ["+", "-", "*"];
            op = easyOps[Math.floor(Math.random() * easyOps.length)];
            
            if (op === "+") {
                a = Math.floor(Math.random() * 20) + 1;
                b = Math.floor(Math.random() * 20) + 1;
                correct = a + b;
            } else if (op === "-") {
                a = Math.floor(Math.random() * 30) + 1;
                b = Math.floor(Math.random() * a) + 1;
                correct = a - b;
            } else {
                a = Math.floor(Math.random() * 12) + 1;
                b = Math.floor(Math.random() * 12) + 1;
                correct = a * b;
            }
            break;

        case "medium":
            if (random < 0.70) {
                op = "/";
                b = Math.floor(Math.random() * 12) + 1;
                correct = Math.floor(Math.random() * 12) + 1;
                a = b * correct;
            } else if (random < 0.85) {
                op = "*";
                a = Math.floor(Math.random() * 12) + 1;
                b = Math.floor(Math.random() * 12) + 1;
                correct = a * b;
            } else if (random < 0.93) {
                op = "-";
                a = Math.floor(Math.random() * 50) + 1;
                b = Math.floor(Math.random() * a) + 1;
                correct = a - b;
            } else {
                op = "+";
                a = Math.floor(Math.random() * 30) + 1;
                b = Math.floor(Math.random() * 30) + 1;
                correct = a + b;
            }
            break;

        case "hard":
            if (random < 0.50) {
                const negativeOps = ["+", "-", "*", "/"];
                op = negativeOps[Math.floor(Math.random() * negativeOps.length)];
                
                if (op === "+") {
                    a = Math.floor(Math.random() * 30) - 15;
                    b = Math.floor(Math.random() * 30) - 15;
                    correct = a + b;
                } else if (op === "-") {
                    a = Math.floor(Math.random() * 30) - 15;
                    b = Math.floor(Math.random() * 30) - 15;
                    correct = a - b;
                } else if (op === "*") {
                    a = Math.floor(Math.random() * 12) - 6;
                    b = Math.floor(Math.random() * 12) - 6;
                    correct = a * b;
                } else {
                    b = Math.floor(Math.random() * 12) - 6;
                    while (b === 0) b = Math.floor(Math.random() * 12) - 6;
                    correct = Math.floor(Math.random() * 12) - 6;
                    a = b * correct;
                }
            } else if (random < 0.75) {
                op = "/";
                b = Math.floor(Math.random() * 15) + 1;
                correct = Math.floor(Math.random() * 15) + 1;
                a = b * correct;
            } else {
                op = "*";
                a = Math.floor(Math.random() * 15) + 1;
                b = Math.floor(Math.random() * 15) + 1;
                correct = a * b;
            }
            break;

        default:
            op = "+";
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 20) + 1;
            correct = a + b;
    }

    const options = new Set([correct]);
    let attempts = 0;
    while (options.size < 4 && attempts < 100) {
        let offset;
        if (difficulty === "hard" && Math.random() < 0.3) {
            offset = Math.floor(Math.random() * 20) - 10;
        } else {
            offset = Math.floor(Math.random() * 10) - 5;
        }
        const wrong = correct + offset;
        if (wrong !== correct && wrong >= -50 && wrong <= 100) {
            options.add(wrong);
        }
        attempts++;
    }
    
    const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op;
    return {
        q: `${a} ${opSymbol} ${b}`,
        correct,
        options: Array.from(options).sort(() => Math.random() - 0.5)
    };
}

// ============================================
// PARTICLE SYSTEM
// ============================================

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            life: 1,
            decay: Math.random() * 0.02 + 0.01,
            color: color,
            size: Math.random() * 6 + 3
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= p.decay;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ============================================
// GAME ACTIONS
// ============================================

function submitAnswer(side, val, startTime) {
    if (!gameRunning) return;
    const q = side === "left" ? leftQ : rightQ;
    const timeTaken = startTime ? (Date.now() - startTime) / 1000 : 0;

    // Prevent AI from answering twice
    if (isAIMode && side === "right" && aiBusy) return;
    if (isAIMode && side === "right") aiBusy = true;

    if (val === q.correct) {
        const pullAmount = 25;
        pullOffset = side === "left" ? -pullAmount : pullAmount;
        ropePosition += pullOffset;
        
        if (side === "left") {
            leftPullStrength = 1;
            spawnParticles(canvas.width / 2 - 100, canvas.height / 2, leftPlayerColor, 20);
        } else {
            rightPullStrength = 1;
            spawnParticles(canvas.width / 2 + 100, canvas.height / 2, rightPlayerColor, 20);
        }
        
        if (side === "left") {
            if (leftLives < MAX_LIVES) leftLives++;
            leftScore++;
            leftStreak++;
            gameStats.left.correct++;
            gameStats.left.totalTime += timeTaken;
        } else {
            if (rightLives < MAX_LIVES) rightLives++;
            rightScore++;
            rightStreak++;
            gameStats.right.correct++;
            gameStats.right.totalTime += timeTaken;
        }
    } else {
        shakeAmount = 15;
        if (side === "left") {
            leftLives--;
            leftStreak = 0;
            gameStats.left.wrong++;
            spawnParticles(canvas.width / 2 - 100, canvas.height / 2, "#ff0000", 10);
        } else {
            rightLives--;
            rightStreak = 0;
            gameStats.right.wrong++;
            spawnParticles(canvas.width / 2 + 100, canvas.height / 2, "#ff0000", 10);
        }
        triggerShake(side + "Panel");
    }

    updateUI();
    if (!checkWin()) {
        setTimeout(() => {
            pullOffset = 0;
        }, 150);
        newQuestions();
    } else {
        if (isAIMode && aiThinkTimer) { 
            clearTimeout(aiThinkTimer);
            aiThinkTimer = null; 
        }
        if (isAIMode) aiBusy = false;
    }
    if (isAIMode && side === "right") {
        setTimeout(() => { aiBusy = false; }, 200);
    }
}

// ============================================
// AI LOGIC (only used in AI mode)
// ============================================

function aiTurn() {
    if (!isAIMode || !gameRunning || aiBusy) return;
    const q = rightQ;
    if (!q) return;

    const correct = q.correct;
    let aiAnswer;

    let accuracy = 1.0;
    if (difficulty === "easy") accuracy = 0.55;
    else if (difficulty === "medium") accuracy = 0.70;
    else accuracy = 0.85;

    if (Math.random() < accuracy) {
        aiAnswer = correct;
    } else {
        const wrongOptions = q.options.filter(o => o !== correct);
        if (wrongOptions.length > 0) {
            aiAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        } else {
            aiAnswer = correct + (Math.random() < 0.5 ? 1 : -1);
        }
    }

    let delay = 0;
    if (difficulty === "easy") delay = 900 + Math.random() * 1000;
    else if (difficulty === "medium") delay = 500 + Math.random() * 700;
    else delay = 300 + Math.random() * 500;

    if (aiThinkTimer) clearTimeout(aiThinkTimer);
    aiThinkTimer = setTimeout(() => {
        if (!gameRunning) return;
        const btns = document.querySelectorAll('#rightOptions .option-btn');
        for (let btn of btns) {
            if (parseInt(btn.textContent) === aiAnswer) {
                btn.click();
                return;
            }
        }
        if (btns.length > 0) btns[0].click();
    }, delay);
}

// ============================================
// WIN/LOSE CONDITIONS
// ============================================

function checkWin() {
    let winner = "";
    if (ropePosition <= -150 || rightLives <= 0) winner = "left";
    else if (ropePosition >= 150 || leftLives <= 0) winner = "right";

    if (winner) {
        gameRunning = false;
        clearInterval(timerInterval);
        if (isAIMode && aiThinkTimer) { 
            clearTimeout(aiThinkTimer);
            aiThinkTimer = null; 
        }
        if (isAIMode) aiBusy = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        calculateStats();
        showCelebration(winner);
        return true;
    }
    return false;
}

function calculateStats() {
    gameStats.left.avgTime = gameStats.left.correct > 0 ? 
        (gameStats.left.totalTime / gameStats.left.correct).toFixed(2) : 0;
    gameStats.right.avgTime = gameStats.right.correct > 0 ? 
        (gameStats.right.totalTime / gameStats.right.correct).toFixed(2) : 0;
}

function showCelebration(winner) {
    const winnerName = winner === "left" ? leftPlayerName : rightPlayerName;
    const winnerColor = winner === "left" ? leftPlayerColor : rightPlayerColor;
    
    celebrationText.textContent = `🏆 ${winnerName} WINS! 🏆`;
    celebrationText.style.color = winnerColor;
    celebrationSubtext.textContent = `Incredible Pulling Power in ${seconds}s!`;
    celebration.style.display = "flex";
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            spawnParticles(
                Math.random() * canvas.width,
                Math.random() * canvas.height * 0.5,
                winnerColor,
                30
            );
        }, i * 300);
    }
    
    setTimeout(() => {
        celebration.style.display = "none";
        showWinModal(winner);
    }, 4000);
}

function showWinModal(winner) {
    const winnerName = winner === "left" ? leftPlayerName : rightPlayerName;
    const loserName = winner === "left" ? rightPlayerName : leftPlayerName;
    const winnerScore = winner === "left" ? leftScore : rightScore;
    const loserScore = winner === "left" ? rightScore : leftScore;
    const winnerLives = winner === "left" ? leftLives : rightLives;
    const loserLives = winner === "left" ? rightLives : leftLives;
    const winnerStats = winner === "left" ? gameStats.left : gameStats.right;
    const loserStats = winner === "left" ? gameStats.right : gameStats.left;
    
    document.getElementById("winText").textContent = `🎉 ${winnerName} Wins! 🎉`;
    
    let statsHTML = `
        <div class="stat-item">
            <span class="label">${winnerName} Score:</span>
            <span class="value">${winnerScore}</span>
        </div>
        <div class="stat-item">
            <span class="label">${loserName} Score:</span>
            <span class="value">${loserScore}</span>
        </div>
        <div class="stat-item">
            <span class="label">${winnerName} Lives Remaining:</span>
            <span class="value">${winnerLives} ❤️</span>
        </div>
        <div class="stat-item">
            <span class="label">${loserName} Lives Remaining:</span>
            <span class="value">${loserLives} ❤️</span>
        </div>
        <div class="stat-item">
            <span class="label">${winnerName} Correct Answers:</span>
            <span class="value">${winnerStats.correct}</span>
        </div>
        <div class="stat-item">
            <span class="label">${winnerName} Wrong Answers:</span>
            <span class="value">${winnerStats.wrong}</span>
        </div>
        <div class="stat-item">
            <span class="label">${winnerName} Avg Response Time:</span>
            <span class="value">${winnerStats.avgTime}s</span>
        </div>
        <div class="stat-item">
            <span class="label">${loserName} Avg Response Time:</span>
            <span class="value">${loserStats.avgTime}s</span>
        </div>
        <div class="stat-item">
            <span class="label">Total Game Time:</span>
            <span class="value">${seconds}s</span>
        </div>
        <div class="stat-item" style="border-bottom: none; padding-top: 10px; font-size: 14px; color: #636e72;">
            <span class="label">Difficulty:</span>
            <span class="value" style="text-transform: capitalize;">${difficulty}</span>
        </div>
    `;
    
    if (isAIMode) {
        statsHTML += `
            <div class="stat-item" style="border-bottom: none; padding-top: 5px; font-size: 14px; color: #636e72;">
                <span class="label">Mode:</span>
                <span class="value">🤖 vs AI</span>
            </div>
        `;
    }
    
    document.getElementById("statsContainer").innerHTML = statsHTML;
    document.getElementById("winModal").classList.add("active");
}

// ============================================
// RENDERING ENGINE
// ============================================

function draw() {
    if (!gameRunning && celebration.style.display === "none") {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        return;
    }
    
    let shakeX = 0, shakeY = 0;
    if (shakeAmount > 0) {
        shakeX = (Math.random() - 0.5) * shakeAmount;
        shakeY = (Math.random() - 0.5) * shakeAmount;
        shakeAmount *= 0.9;
        if (shakeAmount < 0.5) shakeAmount = 0;
    }
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerY = canvas.height / 2;
    
    if (leftPullStrength > 0) {
        leftPullStrength *= 0.95;
        if (leftPullStrength < 0.01) leftPullStrength = 0;
    }
    if (rightPullStrength > 0) {
        rightPullStrength *= 0.95;
        if (rightPullStrength < 0.01) rightPullStrength = 0;
    }
    
    const extraPull = (leftPullStrength - rightPullStrength) * 10;
    const ropeX = (canvas.width / 2) + ropePosition + (pullOffset * 0.5) + extraPull;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, centerY + 50);
    gradient.addColorStop(0, "#87ceeb");
    gradient.addColorStop(0.7, "#e8f5ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, centerY + 50);

    // Ground
    ctx.fillStyle = "#5cb85c";
    ctx.fillRect(0, centerY + 50, canvas.width, canvas.height - centerY - 50);

    // Grass detail
    ctx.fillStyle = "#4CAF50";
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, centerY + 47, 2, 6);
    }

    // Win threshold indicators
    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 150, 0);
    ctx.lineTo(canvas.width / 2 - 150, canvas.height);
    ctx.moveTo(canvas.width / 2 + 150, 0);
    ctx.lineTo(canvas.width / 2 + 150, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(255, 215, 0, 0.4)";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("🏆 WIN ZONE", canvas.width / 2 - 150, 10);
    ctx.fillText("🏆 WIN ZONE", canvas.width / 2 + 150, 10);

    // Shadows
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(ropeX - 140, centerY + 65, 30, 10, 0, 0, Math.PI*2);
    ctx.ellipse(ropeX + 140, centerY + 65, 30, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // Center marker
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, centerY + 15, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚔️", canvas.width / 2, centerY + 15);

    // Rope
    const ropeGradient = ctx.createLinearGradient(ropeX - 220, 0, ropeX + 220, 0);
    ropeGradient.addColorStop(0, "#8d6e63");
    ropeGradient.addColorStop(0.3, "#a1887f");
    ropeGradient.addColorStop(0.5, "#d4a373");
    ropeGradient.addColorStop(0.7, "#a1887f");
    ropeGradient.addColorStop(1, "#8d6e63");
    
    ctx.lineWidth = 12;
    ctx.strokeStyle = ropeGradient;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ropeX - 220, centerY + 15);
    ctx.lineTo(ropeX + 220, centerY + 15);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rope texture
    ctx.strokeStyle = "rgba(139, 69, 19, 0.3)";
    ctx.lineWidth = 2;
    for (let i = -200; i <= 200; i += 15) {
        ctx.beginPath();
        ctx.moveTo(ropeX + i, centerY + 8);
        ctx.lineTo(ropeX + i + 8, centerY + 22);
        ctx.stroke();
    }

    drawPlayer(ropeX - 140, centerY + 15, true);
    drawPlayer(ropeX + 140, centerY + 15, false);

    updateParticles();
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    const progress = ((ropePosition / 150) * 100).toFixed(0);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`⚡ ${Math.abs(progress)}%`, canvas.width / 2, centerY - 30);
    
    ctx.restore();
    animationId = requestAnimationFrame(draw);
}

function drawPlayer(x, y, isLeft) {
    const skin = "#ffdbac";
    const hair = isLeft ? "#4b2c20" : "#f1c40f";
    const pullSide = isLeft ? 1 : -1;
    const color = isLeft ? leftPlayerColor : rightPlayerColor;
    const name = isLeft ? leftPlayerName : rightPlayerName;
    
    const glow = isLeft ? leftPullStrength : rightPullStrength;
    if (glow > 0.1) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 30 * glow;
    }

    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.roundRect(x - 20, y - 45, 40, 65, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x, y - 70, 22, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, y - 78, 23, Math.PI, 0);
    ctx.fill();

    const eyeOffset = isLeft ? 3 : -3;
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(x - 7 + eyeOffset, y - 72, 2.5, 0, Math.PI*2);
    ctx.arc(x + 7 + eyeOffset, y - 72, 2.5, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 62, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.strokeStyle = skin;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    const pullAngle = isLeft ? Math.sin(Date.now() / 200) * 0.3 : Math.sin(Date.now() / 200 + 1) * 0.3;
    const armExtension = isLeft ? 50 + pullAngle * 10 : 50 - pullAngle * 10;
    ctx.beginPath();
    ctx.moveTo(x + (pullSide * 5), y - 20);
    ctx.lineTo(x + (pullSide * armExtension), y + pullAngle * 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + (pullSide * 2), y - 15);
    ctx.lineTo(x + (pullSide * (armExtension - 10)), y - pullAngle * 5 + 10);
    ctx.stroke();

    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(x - 16, y + 20, 12, 45);
    ctx.fillRect(x + 4, y + 20, 12, 45);

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 0;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(name, x, y - 95);

    const lives = isLeft ? leftLives : rightLives;
    ctx.font = "14px Arial";
    ctx.textBaseline = "top";
    ctx.fillText("❤️".repeat(Math.min(lives, 5)), x, y + 70);
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    document.getElementById("leftLives").textContent = "❤️".repeat(Math.min(leftLives, 10));
    document.getElementById("rightLives").textContent = "❤️".repeat(Math.min(rightLives, 10));
    document.getElementById("leftScore").textContent = `Score: ${leftScore}`;
    document.getElementById("rightScore").textContent = `Score: ${rightScore}`;
    document.getElementById("leftStreak").textContent = `🔥 Streak: ${leftStreak}`;
    document.getElementById("rightStreak").textContent = `🔥 Streak: ${rightStreak}`;
}

function triggerShake(id) {
    const p = document.getElementById(id);
    p.classList.add("shake");
    setTimeout(() => p.classList.remove("shake"), 400);
}

function newQuestions() {
    leftQ = generateQuestion();
    rightQ = generateQuestion();
    document.getElementById("leftQuestion").textContent = leftQ.q;
    document.getElementById("rightQuestion").textContent = rightQ.q;
    renderOptions("leftOptions", leftQ, "left");
    renderOptions("rightOptions", rightQ, "right");

    if (isAIMode && gameRunning) {
        if (aiThinkTimer) clearTimeout(aiThinkTimer);
        aiThinkTimer = setTimeout(() => {
            if (gameRunning) aiTurn();
        }, 400);
    }
}

function renderOptions(id, obj, side) {
    const c = document.getElementById(id);
    c.innerHTML = "";
    obj.options.forEach(o => {
        const b = document.createElement("button");
        b.className = `option-btn ${side}-option`;
        b.textContent = o;
        const startTime = Date.now();
        b.onclick = () => submitAnswer(side, o, startTime);
        c.appendChild(b);
    });
}

// ============================================
// START / RESET
// ============================================

function startGame() {
    // Add AI mode class to body for styling
    if (isAIMode) {
        document.body.classList.add('ai-mode');
    }
    
    // Get player names
    leftPlayerName = document.getElementById("leftNameInput").value.trim() || "Player 1";
    
    if (isAIMode) {
        rightPlayerName = "AI";
        rightPlayerColor = "#3498db";
    } else {
        rightPlayerName = document.getElementById("rightNameInput").value.trim() || "Player 2";
        rightPlayerColor = document.getElementById("rightColor").value;
    }
    
    leftPlayerColor = document.getElementById("leftColor").value;
    difficulty = document.getElementById("difficultySelect").value;
    startingLives = parseInt(document.getElementById("livesSelect").value);

    // Update UI with names
    document.getElementById("leftPlayerName").textContent = leftPlayerName;
    document.getElementById("rightPlayerName").textContent = rightPlayerName;
    document.getElementById("leftPanel").style.borderColor = leftPlayerColor;
    document.getElementById("rightPanel").style.borderColor = rightPlayerColor;

    // Reset game state
    welcomeBox.style.display = "none";
    gameRunning = true;
    if (isAIMode) {
        aiBusy = false;
        if (aiThinkTimer) { clearTimeout(aiThinkTimer); aiThinkTimer = null; }
    }
    leftLives = startingLives;
    rightLives = startingLives;
    leftScore = 0;
    rightScore = 0;
    leftStreak = 0;
    rightStreak = 0;
    ropePosition = 0;
    seconds = 0;
    particles = [];
    gameStats = {
        left: { correct: 0, wrong: 0, avgTime: 0, totalTime: 0 },
        right: { correct: 0, wrong: 0, avgTime: 0, totalTime: 0 }
    };

    updateUI();
    newQuestions();
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    draw();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById("timer").textContent = `⏱️ Time: ${seconds}s`;
    }, 1000);
}

function closeModal() {
    // Remove AI mode class
    document.body.classList.remove('ai-mode');
    
    document.getElementById("winModal").classList.remove("active");
    welcomeBox.style.display = "block";
    document.getElementById("timer").textContent = "⏱️ Time: 0s";
    document.getElementById("leftPanel").style.borderColor = "transparent";
    document.getElementById("rightPanel").style.borderColor = "transparent";
    if (isAIMode && aiThinkTimer) { 
        clearTimeout(aiThinkTimer);
        aiThinkTimer = null; 
    }
    if (isAIMode) aiBusy = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// ============================================
// POLYFILL & INITIALIZATION
// ============================================

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w/2) r = w/2;
        if (r > h/2) r = h/2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}

// Initialize event listeners
document.getElementById("startBtn").onclick = startGame;
draw();