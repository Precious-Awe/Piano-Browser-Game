# Piano Browser Game - Architecture

## Project

MSc Computing and IT Dissertation

Project Title:
Browser-Based Piano Rhythm Game Using the Web Audio API

---

# Design Philosophy

The application follows a modular architecture using JavaScript ES Modules.

The objective is to separate responsibilities into independent modules that are easier to understand, maintain and extend.

Each module has one primary responsibility (Single Responsibility Principle).

This architecture improves:

- maintainability
- readability
- scalability
- testing
- future development

---

# Current Architecture

```
index.html

css/
    style.css
    game.css
    keyboard.css

js/
    script.js
    game.js
    renderer.js
    scoring.js
    notes.js
    audio.js
    leaderboard.js (future)
```

---

# Module Responsibilities

## script.js

Entry point of the application.

Responsibilities:

- start the application
- initialise audio
- initialise the game
- connect modules together

Contains almost no game logic.

---

## game.js

Main controller of the application.

Responsibilities:

- game lifecycle
- timer
- player input
- note spawning
- game rules
- game state

Acts as the coordinator between modules.

---

## scoring.js

Responsible for all score calculations.

Responsibilities:

- score
- combo
- accuracy
- reaction time
- judgement calculations
- statistics

No rendering code.

---

## renderer.js

Responsible for visual presentation.

Responsibilities:

- falling notes
- note animations
- keyboard animations
- judgement animations
- hit line
- screen updates

No game rules.

---

## notes.js

Responsible for musical data.

Responsibilities:

- available notes
- song definitions
- note sequences
- difficulty patterns

No gameplay logic.

---

## audio.js

Responsible for audio.

Responsibilities:

- initialise Web Audio API
- play notes
- audio scheduling (future)

Uses Tone.js.

---

## leaderboard.js

Future module.

Responsibilities:

- save scores
- retrieve scores
- sort rankings
- localStorage

---

# CSS Structure

style.css

General application styling.

game.css

Gameplay interface.

keyboard.css

Keyboard and note rendering.

---

# Development Strategy

The application is developed incrementally.

Each completed feature is:

1. implemented
2. tested
3. committed to Git

This provides a clean Git history and allows rollback if required.

---

# Current Development Roadmap

Completed

- Project setup
- Web Audio API
- ES Modules
- Responsive keyboard
- Responsive scoreboard
- CSS organisation

Next

- Refactor into modules
- Falling note renderer
- Timing engine
- Judgement system
- Song playback
- Leaderboard
- User testing