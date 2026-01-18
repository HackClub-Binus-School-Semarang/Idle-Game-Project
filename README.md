# AGES IDLE: EVOLUTION ENGINE

A data-driven incremental game engine built with vanilla JavaScript. The system features a multi-age progression loop, achievement-based multipliers, and a Big Bang prestige mechanic.

## Demo

Check out this site live at: [Live Site](https://hackclub-binus-school-semarang.github.io/Idle-Game-Project/)!


## 1. CORE ARCHITECTURE

The engine is designed using a **State-Logic-View** separation. This architecture makes the logic easily portable to professional game engines like Unity (C#) or Godot (GDScript).

* **Data Layer:** All game balance (Ages, Upgrades, Milestones) is stored in static configuration objects.
* **Logic Layer:** Handles income calculations, scaling math ($1.15^n$), and prestige formulas.
* **View Layer:** A decoupled UI system that maps game state to the DOM via an element map.

## 2. KEY FEATURES

### THE EVOLUTION LOOP
The game progresses through 5 distinct eras:
1.  **Stone Age** (Food)
2.  **Classical Age** (Olives)
3.  **Medieval Age** (Gold)
4.  **Industrial Age** (Coal)
5.  **Future Age** (Credits)

### THE CHRONICLE (ACHIEVEMENTS)
Milestones track specific upgrade counts. Unlocking a milestone grants a permanent, multiplicative boost to the global production rate.

### THE BIG BANG (PRESTIGE)
Upon reaching the Future Age, players can trigger a Singularity.
* **Shards:** Granted based on the square root of lifetime earnings.
* **Multipliers:** Each shard provides a permanent 10% boost to all future production.

## 3. TECHNICAL SPECIFICATIONS

### MATHEMATICAL SCALING
The engine uses exponential cost scaling to ensure long-term stability:
* **Upgrade Cost:** `BaseCost * (1.15 ^ CurrentCount)`
* **Prestige Formula:** `floor(sqrt(LifetimeEarnings / 1,000,000))`

### NUMBER FORMATTING
A robust logarithmic formatter handles values up to Decillions (10^33) and automatically switches to scientific notation beyond that point to prevent UI overflow.

### PERSISTENCE
Game state is preserved using `localStorage`. 
* **Auto-save:** Triggered every 30 seconds.
* **Manual-save:** Triggered on every significant player action (Buying, Evolving, Prestige).

## 4. INSTALLATION AND SETUP

1.  Clone the repository.
2.  Ensure `game.js`, `style.css`, and `index.html` are in the same directory.
3.  The engine initializes via the `loadGame()` bootstrap function at the bottom of the script.

## 5. FUTURE REFACTORING (TO UNITY/GODOT)
To port this engine:
* Map the 10Hz `setInterval` to the engine's `Process` or `Update` loop.
* Replace the `els` object with UI Canvas references.

## 6. LICENSE

This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute this software with proper attribution.  
See the `LICENSE` file for full details.
