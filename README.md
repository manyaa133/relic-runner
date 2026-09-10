# 🏆 Relic Runner: The Lost Expeditions

> **An original 2D platformer inspired by classic retro platform games.**

**Relic Runner: The Lost Expeditions** is a fast-paced, nostalgic yet modern 2D side-scrolling browser platform adventure. Built from the ground up using pure HTML5 Canvas, modern Vanilla JavaScript (ES6 Modules), and real-time synthesized Web Audio, it delivers crisp, responsive physics, rich multi-biome levels, and deep arcade polish with zero external dependencies.

---

## 🎮 Play Online via GitHub Pages

You can play the game immediately in any modern desktop browser:
👉 **[https://manyaa113.github.io/relic-runner/](https://manyaa113.github.io/relic-runner/)**

---

## ✨ Features

- **🕹️ Tight & Forgiving Physics**:
  - **Coyote Time (120ms)**: Jump shortly after stepping off a platform ledge.
  - **Jump Buffering (140ms)**: Jump inputs pressed just before touching ground execute automatically upon landing.
  - **Variable Jump Height**: Tap for short hops, hold for high leaps.
  - **Anti-Sticky Corner Slipping**: Smooth corner-nudging past overhead platform edges.
  - **Non-Slippery Traction**: Crisp acceleration and immediate stopping.
- **👥 4 Selectable Original Heroes**: Distinct speed, jump agility, and survival attributes.
- **🗺️ 4 Handcrafted Biome Levels**:
  - **Level 1: Emerald Canopy** *(Forest Ruins)*
  - **Level 2: Forgotten Catacombs** *(Ancient Temple)*
  - **Level 3: Magma Foundry** *(Industrial Lava Caverns)*
  - **Level 4: Crystal Spire** *(Astral Cosmic Heights)*
- **🚩 Fair Checkpoint & Lives Loop**:
  - Start with 3 (or 4) lives; discover hidden Extra Life Hearts ❤️ (+1 Life, max 6).
  - Checkpoint totems save your respawn position.
  - Post-hit invulnerability shield upon respawn.
  - Clear **Game Over** screen when all lives are exhausted (fresh start from Level 1).
- **🎶 Procedural Web Audio Engine**:
  - Real-time algorithmic polyphonic chiptune soundtrack for menu, levels, game over, and victory.
  - Dynamic retro 8-bit/16-bit sound effects.
  - Audio starts automatically on first user interaction with full volume & mute controls.
- **📺 Retro-Modern Visuals**:
  - Procedural 16-bit pixel-art tilesets and animated parallax backgrounds.
  - Toggleable CRT scanline filter.
  - Responsive 16:9 canvas with letterboxing and Fullscreen mode (`⛶`).
  - Built-in collision boundaries debugger (`F3` or `B`).
- **💾 LocalStorage Persistence**:
  - Automatically saves high scores, max level unlocked, hero selection, and audio settings.

---

## 🕹️ Controls

The game features **full dual-control parity** supporting both WASD and Arrow Keys simultaneously:

| Action | Primary (WASD) | Secondary (Arrow Keys) | Additional Key |
| :--- | :---: | :---: | :---: |
| **Move Left** | `A` | `←` | — |
| **Move Right** | `D` | `→` | — |
| **Jump** | `W` | `↑` | `Space` / `K` |
| **Down / Crouch** | `S` | `↓` | — |
| **Pause Game** | `ESC` | `P` | — |
| **Toggle Fullscreen** | `⛶` button | Settings menu | — |
| **Collision Debugger** | `F3` | `B` | — |

*Note: All key combinations (e.g. `A + W`, `→ + ↑`, `D + Space`) work simultaneously without key-blocking.*

---

## 👥 Character Roster

| Hero | Title | Speed | Jump | Lives | Special Trait |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Alex the Explorer** | *Balanced Adventurer* | `1.00x` | `1.00x` | 3 ❤️ | Reliable all-around agility and balanced physics. |
| **Dash Swiftfoot** | *Agile Speedster* | `1.22x` | `0.92x` | 3 ❤️ | High sprint velocity for clearing wide horizontal chasms. |
| **Zara Skybound** | *Acrobatic Leaper* | `0.90x` | `1.15x` | 3 ❤️ | Superb vertical leap for reaching high ledges and secrets. |
| **Captain Ron** | *Veteran Survivor* | `0.96x` | `0.98x` | 4 ❤️ | Starts with 4 lives and extended recovery protection. |

---

## 🏰 Level Information & Mechanics

1. **Collectibles**:
   - **Gold Coins** (+100 pts) & **Blue Gems** (+500 pts) reward exploration.
   - **Ancient Keys 🔑**: Unlock sealed barrier gates on the path.
   - **Sacred Relic 🏆**: Found in each chamber; required to open the Level Exit Portal.
   - **Extra Life Heart ❤️**: Grants +1 Life with glowing particle bursts.
2. **Hazards**:
   - **Molten Lava**: Instant fatal liquid hazard.
   - **Spikes & Thorns**: Multi-directional puncture damage.
   - **Oscillating Sawblades & Flame Jets**: Timed environmental obstacles.
   - **Plasma Turrets**: Wall-mounted turrets firing energy orbs.
3. **Enemies**:
   - **Slime Crawlers**: Ledge-patrolling foes.
   - **Cave Gliders**: Sine-wave aerial bats.
   - **Leap Hoppers**: Charging jumping spiders.
   - *Stomp Rule*: Falling onto enemy heads from above defeats them and bounces the player upwards.

---

## 🚀 How to Run Locally

Because the game is 100% static with no compilation step, you can run it locally in two easy ways:

### Option 1: Direct File Opening
Double-click `index.html` or open it directly in Chrome, Firefox, Safari, or Edge.

### Option 2: Local HTTP Server
```bash
# Using Node.js:
npx serve .

# Or using Python:
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

---

## 🌐 How to Deploy to GitHub Pages

Deploying takes under 1 minute with zero build commands:

1. **Push your code** to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Relic Runner game"
   git branch -M main
   git remote add origin https://github.com/manyaa113/relic-runner.git
   git push -u origin main
   ```
2. On GitHub, navigate to your repository:
   - Click **Settings** (tab at top).
   - Scroll down to the **Pages** section on the left sidebar.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/(root)`.
   - Click **Save**.
3. In ~30 seconds, GitHub Pages will deploy your site at:
   `https://manyaa113.github.io/relic-runner/`

---

## 📁 Repository Structure

```
├── index.html              # Main HTML entry point & UI overlays
├── style.css               # Retro-modern styling & responsive 16:9 canvas
├── js/
│   ├── main.js             # Application entry point & input event loop
│   ├── game.js             # Core game engine & state manager
│   ├── physics.js          # AABB tile collision & physics engine
│   ├── collision.js        # Physics & collision re-exports
│   ├── player.js           # Player controller (coyote time, buffering)
│   ├── characters.js       # Character roster & procedural renderers
│   ├── enemies.js          # Enemy AI classes & stomp mechanics
│   ├── hazards.js          # Sawblades, flamejets & projectiles
│   ├── collectibles.js     # Coins, gems, keys, relics & extra lives
│   ├── checkpoints.js      # Checkpoint totems & respawn logic
│   ├── levels.js           # Handcrafted multi-biome level data
│   ├── levelValidator.js   # Automated mathematical geometry validator
│   ├── camera.js           # Smooth lerp camera & screen shake
│   ├── particles.js        # Dynamic particle particle systems
│   ├── renderer.js         # Procedural pixel-art & parallax renderer
│   ├── audio.js            # Real-time Web Audio API chiptune synthesizer
│   ├── ui.js               # HUD, menus, modals & fullscreen manager
│   └── saveSystem.js       # LocalStorage progress & settings persistence
├── assets/                 # Organized asset directories with .gitkeep
│   ├── characters/
│   ├── enemies/
│   ├── backgrounds/
│   ├── tiles/
│   ├── sounds/
│   ├── music/
│   └── ui/
├── tests/
│   └── test_game.js        # Automated Node test suite
└── README.md
```

---

## 📄 License & Attribution

- **Original Game Concept**: All character designs, sprites, levels, mechanics, sound synthesis routines, and code in this project are original creations.
- No copyrighted characters, artwork, audio recordings, or assets from *Dangerous Dave* or other commercial titles are used.
- Open source under the **MIT License**.

