```markdown
# Tug of War Math - Ultra Edition 🏆

## Overview
**Tug of War Math** is a high-energy, two-player educational game built with **HTML5, CSS3, and JavaScript**. Players engage in a head-to-head mental math battle where speed and accuracy physically move the rope on the screen. 

This version features a **Life-Stealing mechanic**, **realistic animated characters**, and **dynamic physics-based animations**.

---

## 🚀 Key Features

* **Life-Stealing Mechanic (❤️)**: 
    * Players start with **5 lives**.
    * **Heal:** Every correct answer adds +1 life (capped at 10).
    * **Damage:** Every wrong answer removes -1 life and triggers a visual "shake" effect.
* **Realistic Canvas Graphics**:
    * Characters feature detailed hair, facial expressions (strained effort), and proper body proportions.
    * Elliptical ground shadows and a sky-gradient background for depth.
* **Dynamic Animations**:
    * **Pull Jerk:** The rope "jerks" toward the player immediately upon a correct answer.
    * **Error Shake:** The quiz panel vibrates violently when a wrong answer is chosen.
* **Full Math Suite**: Generates random questions across **Addition, Subtraction, Multiplication, and Division** (with logic to ensure division results are always whole numbers).
* **Cinematic Celebration**: A full-screen, high-impact animated overlay triggers when a player wins, before transitioning to the final score modal.

---

## 🕹️ How to Play

1.  **Launch**: Open `index.html` in any modern web browser.
2.  **The Goal**: Either pull the rope completely to your side **OR** deplete your opponent's lives to 0.
3.  **Controls**: 
    * **Player Left**: Tap/Click the correct result in the green panel.
    * **Player Right**: Tap/Click the correct result in the blue panel.
4.  **Lives**: Keep an eye on your heart bar! Correct answers help you recover from previous mistakes.
5.  **Winning**: Once a victory condition is met, a large "WINNER" animation will play.

---

## 📂 File Structure




tug-of-war-math-game/
│
├── index.html        # Game layout, celebration overlay, and instructions
├── style.css         # Animations (shake, bounce, pulse), layout, and UI polish
├── script.js         # Math engine, Canvas rendering, and game state logic
└── README.md         # Documentation



---

## 🛠️ Technical Highlights

* **Canvas API**: Used for drawing high-detail characters and handling the rope physics at 60fps.
* **CSS Keyframes**: Handles the complex celebration animations and the "panel-shake" feedback loop.
* **Responsive Design**: The game uses a `grid-template-columns` layout that keeps the "Stage" centered regardless of screen size.
* **Smart Math Logic**: The division engine calculates the divisor and quotient first to ensure the dividend is always a clean, whole number.

---

## Author
Built with ❤️ by **Agunechemba**
[agunechemba.name.ng](https://agunechemba.name.ng)

```