```markdown
# Tug of War Math Game (Enhanced Version)

## Overview

Tug of War Math Game is an interactive, two-player educational experience built with **HTML5, CSS3, and JavaScript**. Players compete in a head-to-head math battle where speed and accuracy determine who wins the tug-of-war.

This version features a **5-lives health system**, **realistic animated characters**, and a **welcome interface** with integrated instructions.

---

## New Features

* **Lives System (❤️)**: Each player starts with 5 lives. A wrong answer results in the loss of a life and a visual "shake" effect on the player's panel.
* **Enhanced Canvas Graphics**: 
    * Detailed characters with hair, facial expressions, and clothing.
    * Dynamic shadows and a sky-gradient background.
    * Twisted-rope texture for a more realistic feel.
* **Dual-Condition Victory**:
    * **Strength Win**: Pull the rope completely to your side.
    * **Survival Win**: Outlast your opponent if they exhaust all 5 lives.
* **Interactive Welcome Box**: The game begins with a central instruction overlay, explaining the rules before the action starts.
* **Visual Feedback**: Quiz panels shake and glow red when a mistake is made, providing immediate haptic-style feedback.

---

## How to Play

1.  **Start**: Launch `index.html` and click **Start Game** in the center box.
2.  **Solve**: Random math problems (Addition, Subtraction, Multiplication) appear in each player's panel.
3.  **Pull**: Tap the correct answer to pull the rope toward your side.
4.  **Avoid Mistakes**: Clicking a wrong answer will cost you one heart (❤️).
5.  **Win**: 
    * Pull the opponent past the threshold.
    * **OR** wait for the opponent to lose all 5 lives.
6.  **Restart**: Use the "Play Again" button in the winner modal to reset lives, the timer, and the rope.

---

## File Structure


```

tug-of-war-math-game/
│
├─ index.html        # Game structure with lives containers and welcome box
├─ style.css         # Modern UI, shake animations, and sky gradients
├─ script.js         # Enhanced character drawing, lives logic, and game state
└─ README.md         # Documentation and instructions

```

---

## Installation

1.  Download the project files into a single folder.
2.  Ensure `index.html`, `style.css`, and `script.js` are present.
3.  Open `index.html` in any modern web browser (Chrome, Edge, Safari, or Firefox).
4.  *Optional*: For the best experience, use a touch-screen device or tablet for head-to-head play.

---

## Technical Details

* **Canvas API**: Uses `requestAnimationFrame` for smooth 60fps rendering of the pulling animation.
* **CSS Animations**: Uses `@keyframes` for the "shake" error effect and modal transitions.
* **Responsive Design**: The game uses a CSS Grid layout that adapts to various screen widths while maintaining the tug-of-war center stage.

---

## Author
Built by [Agunechemba](https://agunechemba.name.ng).