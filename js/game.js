// js/game.js - Core Game Engine, State Coordinator & Loop Orchestrator

import { LEVELS_DATA, Level } from './levels.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { ParticleSystem } from './particles.js';
import { HazardManager, SawbladeHazard, FlameJetHazard } from './hazards.js';
import { EnemyManager, SlimeCrawler, CaveGlider, PlasmaTurret, LeapHopper } from './enemies.js';
import { LevelRenderer } from './renderer.js';
import { UIManager } from './ui.js';
import { saveSystem } from './saveSystem.js';
import { audioManager } from './audio.js';
import { TILE_SIZE, TILE_TYPES, Physics } from './physics.js';
import { LevelValidator } from './levelValidator.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Internal rendering resolution: 960 x 540 (16:9 ratio)
        this.viewWidth = 960;
        this.viewHeight = 540;
        this.canvas.width = this.viewWidth;
        this.canvas.height = this.viewHeight;

        // Subsystems
        this.player = new Player(saveSystem.data.selectedCharacter || 'explorer');
        this.camera = new Camera(this.viewWidth, this.viewHeight);
        this.particles = new ParticleSystem();
        this.hazards = new HazardManager();
        this.enemies = new EnemyManager();
        this.ui = new UIManager(this);

        // State & Tracking
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'TRANSITION', 'GAMEOVER', 'VICTORY'
        this.currentLevelIndex = 0;
        this.currentLevel = null;
        this.lastCheckpointId = null;
        this.checkpointSpawn = null;
        this.hasRelic = false;
        this.keys = new Set();
        this.score = 0;
        this.gameTimer = 0;
        this.animTimer = 0;
        this.floatingTexts = [];

        // Input state
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            jumpPressed: false,
            jumpJustPressed: false
        };

        // Transition timer
        this.transitionTimer = 0;
        this.transitionTargetLevel = 1;

        // Debug collision boundaries (toggleable, default disabled)
        this.debugCollisions = false;

        // Run validation check
        LevelValidator.validateAll();
    }

    init() {
        this.ui.showMainMenu();
    }

    startNewGame(startingLevelNum = 1) {
        this.score = 0;
        this.gameTimer = 0;
        this.currentLevelIndex = startingLevelNum - 1;

        // Reset player lives based on character
        this.player.setCharacter(saveSystem.data.selectedCharacter || 'explorer');

        this.loadLevel(this.currentLevelIndex, true);
        this.state = 'PLAYING';
        this.ui.showInGameHUD();
    }

    loadLevel(index, isNewLevel = true) {
        if (index >= LEVELS_DATA.length) {
            // Completed all levels -> VICTORY!
            this.handleVictory();
            return;
        }

        this.currentLevelIndex = index;
        const data = LEVELS_DATA[index];
        this.currentLevel = new Level(data);

        this.hasRelic = false;
        this.keys.clear();
        this.lastCheckpointId = null;
        this.checkpointSpawn = { ...this.currentLevel.spawn };

        // Clear and rebuild entities
        this.hazards.clear();
        this.enemies.clear();
        this.particles.clear();
        this.floatingTexts = [];

        // Spawn Hazards
        for (const h of this.currentLevel.hazardDefs) {
            if (h.type === 'sawblade') {
                this.hazards.add(new SawbladeHazard(h.x1, h.y1, h.x2, h.y2, h.speed, h.radius));
            } else if (h.type === 'flamejet') {
                this.hazards.add(new FlameJetHazard(h.x, h.y, h.dir, h.onDuration, h.offDuration, h.length));
            }
        }

        // Spawn Enemies
        for (const e of this.currentLevel.enemyDefs) {
            if (e.type === 'slime') {
                this.enemies.add(new SlimeCrawler(e.x, e.y, e.speed, e.color));
            } else if (e.type === 'glider') {
                this.enemies.add(new CaveGlider(e.x, e.y, e.range, e.speed, e.color));
            } else if (e.type === 'turret') {
                this.enemies.add(new PlasmaTurret(e.x, e.y, e.dir, e.fireInterval));
            } else if (e.type === 'hopper') {
                this.enemies.add(new LeapHopper(e.x, e.y, e.color));
            }
        }

        // Place Player
        this.player.spawnAt(this.checkpointSpawn.x, this.checkpointSpawn.y);
        this.player.setCheckpoint(this.checkpointSpawn.x, this.checkpointSpawn.y);

        // Reset Camera
        const levelW = this.currentLevel.widthInTiles * TILE_SIZE;
        const levelH = this.currentLevel.heightInTiles * TILE_SIZE;
        this.camera.reset(this.player.x, this.player.y, levelW, levelH);

        // Music
        audioManager.playMusic(this.currentLevel.musicTrack);

        // Unlock in save system
        saveSystem.unlockLevel(index + 1);

        this.ui.updateHUD();
        this.showFloatingText(this.currentLevel.name.toUpperCase(), this.player.x, this.player.y - 40, '#00d2d3');
    }

    handleVictory() {
        this.state = 'VICTORY';
        saveSystem.updateHighScore(this.score);
        saveSystem.recordStats(0, 0, 0, true);

        this.ui.showVictory({
            score: this.score,
            time: this.gameTimer
        });
    }

    handleRespawnOrGameOver() {
        if (this.player.lives > 0) {
            // Respawn at latest activated checkpoint
            this.player.respawnAtCheckpoint();
            this.showFloatingText('RESPAWNED!', this.player.x, this.player.y - 20, '#54a0ff');
            this.ui.updateHUD();
        } else {
            // Zero Lives Remaining -> GAME OVER!
            this.state = 'GAMEOVER';
            saveSystem.updateHighScore(this.score);
            this.ui.showGameOver({
                score: this.score,
                levelName: this.currentLevel.name
            });
        }
    }

    onPlayerDied() {
        this.player.lives -= 1;
        saveSystem.recordStats(0, 0, 1, false);
        this.ui.updateHUD();
    }

    restartFromCheckpoint() {
        if (this.state === 'PAUSED') this.togglePause();
        this.player.respawnAtCheckpoint();
        this.ui.updateHUD();
    }

    restartLevel() {
        if (this.state === 'PAUSED') this.togglePause();
        this.loadLevel(this.currentLevelIndex, false);
    }

    returnToMainMenu() {
        this.state = 'MENU';
        this.ui.showMainMenu();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.ui.showPauseMenu();
            audioManager.playSfx('ui_click');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.ui.hidePauseMenu();
            audioManager.playSfx('ui_click');
        }
    }

    addScore(pts) {
        this.score += pts;
        this.ui.updateHUD();
    }

    addCoin() {
        saveSystem.recordStats(1, 0, 0, false);
    }

    addGem() {
        saveSystem.recordStats(0, 1, 0, false);
    }

    addKey(keyId) {
        this.keys.add(keyId);
        this.currentLevel.unlockAllDoorsWithId(keyId);
        this.ui.updateHUD();
    }

    showFloatingText(text, x, y, color = '#ffffff') {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -35,
            life: 1.6,
            maxLife: 1.6,
            color
        });
    }

    // ==========================================
    // MAIN UPDATE LOOP
    // ==========================================
    update(dt) {
        this.animTimer += dt;

        if (this.state === 'PLAYING') {
            this.gameTimer += dt;

            // 1. Update Level Platforms & Hazards
            this.currentLevel.updateMovingPlatforms(dt);
            this.hazards.update(dt, this.player, this.particles);
            this.enemies.update(dt, this.currentLevel, this.player, this.particles, this.hazards);

            // 2. Update Collectibles
            for (const c of this.currentLevel.collectibles) {
                c.update(dt);
                if (!c.collected && Physics.checkAABB(this.player.getHitbox(), c.getHitbox())) {
                    c.collect(this.player, this.particles, this);
                }
            }

            // 3. Update Checkpoints
            for (const cp of this.currentLevel.checkpoints) {
                cp.update(dt, this.particles);
                if (!cp.active && Physics.checkAABB(this.player.getHitbox(), cp.getHitbox())) {
                    if (cp.activate(this.particles, this)) {
                        this.lastCheckpointId = cp.id;
                        this.player.setCheckpoint(cp.x, cp.y);
                    }
                }
            }

            // 4. Update Player Physics & Collisions
            this.player.update(dt, this.input, this.currentLevel, this.currentLevel.movingPlatforms, this.particles, this);

            // Reset jumpJustPressed flag after processing
            this.input.jumpJustPressed = false;

            // 5. Check Hazard Collisions (Moving Hazards, Projectiles, and Tile Hazards like Lava & Thorns)
            if (!this.player.isDead && this.player.invulnerableTimer <= 0) {
                const hitEntityHazard = this.hazards.checkPlayerCollision(this.player);
                const hitTileHazard = Physics.checkTileHazards(this.player.getHitbox(), this.currentLevel);

                if (hitEntityHazard || hitTileHazard) {
                    this.player.takeDamage(1, this, this.particles);
                }
            }

            // 6. Check Enemy Stomp / Damage Collisions
            this.enemies.checkPlayerInteractions(this.player, this.particles, this);

            // 7. Check Exit Doorway Interaction (Strictly inside the physical door entrance)
            const exitDoorwayBox = Physics.getExitDoorwayBox(this.currentLevel.exit);
            if (Physics.checkAABB(this.player.getHitbox(), exitDoorwayBox)) {
                if (this.hasRelic) {
                    // Level Completed!
                    this.state = 'TRANSITION';
                    this.transitionTimer = 1.2;
                    this.transitionTargetLevel = this.currentLevelIndex + 1;
                    audioManager.playSfx('level_complete');
                    this.particles.spawnCollectSparkles(this.currentLevel.exit.x + 16, this.currentLevel.exit.y + 16, '#00d2d3', 30);
                    this.showFloatingText('LEVEL COMPLETE!', this.player.x, this.player.y - 30, '#2ed573');
                } else {
                    // Portal Locked prompt
                    if (Math.floor(this.animTimer * 2) % 2 === 0) {
                        this.showFloatingText('FIND THE SACRED RELIC TO OPEN PORTAL!', this.player.x, this.player.y - 30, '#ffd32a');
                    }
                }
            }

            // 8. Update Camera
            const levelW = this.currentLevel.widthInTiles * TILE_SIZE;
            const levelH = this.currentLevel.heightInTiles * TILE_SIZE;
            this.camera.update(dt, this.player, levelW, levelH);
        } else if (this.state === 'TRANSITION') {
            this.transitionTimer -= dt;
            if (this.transitionTimer <= 0) {
                this.loadLevel(this.transitionTargetLevel, true);
                this.state = 'PLAYING';
            }
        }

        // Update Global Particles
        this.particles.update(dt);

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    // ==========================================
    // MAIN RENDER LOOP
    // ==========================================
    render() {
        this.ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

        if (this.state === 'MENU' || !this.currentLevel) {
            // Draw sleek menu background
            LevelRenderer.drawBackground(this.ctx, 'forest', { x: this.animTimer * 20, y: 0 }, this.viewWidth, this.viewHeight, this.animTimer);
            return;
        }

        const camOffset = this.camera.getRenderOffset();

        // 1. Draw Parallax Background
        LevelRenderer.drawBackground(this.ctx, this.currentLevel.theme, this.camera, this.viewWidth, this.viewHeight, this.animTimer);

        // Apply Camera Transform for World Objects
        this.ctx.save();
        this.ctx.translate(-camOffset.x, -camOffset.y);

        // 2. Visible Tile Range Culling
        const startCol = Math.max(0, Math.floor(camOffset.x / TILE_SIZE) - 1);
        const endCol = Math.min(this.currentLevel.widthInTiles - 1, Math.ceil((camOffset.x + this.viewWidth) / TILE_SIZE) + 1);
        const startRow = Math.max(0, Math.floor(camOffset.y / TILE_SIZE) - 1);
        const endRow = Math.min(this.currentLevel.heightInTiles - 1, Math.ceil((camOffset.y + this.viewHeight) / TILE_SIZE) + 1);

        // 3. Draw Tiles
        LevelRenderer.drawTiles(this.ctx, this.currentLevel, startCol, endCol, startRow, endRow, this.animTimer);

        // 4. Draw Checkpoints
        for (const cp of this.currentLevel.checkpoints) {
            cp.draw(this.ctx, this.animTimer);
        }

        // 5. Draw Collectibles
        for (const c of this.currentLevel.collectibles) {
            c.draw(this.ctx, this.animTimer);
        }

        // 6. Draw Moving Platforms
        LevelRenderer.drawMovingPlatforms(this.ctx, this.currentLevel.movingPlatforms, this.animTimer);

        // 7. Draw Hazards
        this.hazards.draw(this.ctx, this.animTimer);

        // 8. Draw Enemies
        this.enemies.draw(this.ctx, this.animTimer);

        // 9. Draw Player
        this.player.draw(this.ctx);

        // 10. Draw Particles
        this.particles.draw(this.ctx);

        // 11. Draw Floating Notifications
        for (const ft of this.floatingTexts) {
            const alpha = Math.max(0, ft.life / ft.maxLife);
            this.ctx.save();
            this.ctx.font = 'bold 12px "Courier New", monospace';
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
            this.ctx.restore();
        }

        // 12. Optional Debug Collision Boundaries (visual inspection tool)
        if (this.debugCollisions) {
            this.renderDebugCollisionBoundaries(this.ctx, startCol, endCol, startRow, endRow);
        }

        this.ctx.restore();

        // Level Transition Fade
        if (this.state === 'TRANSITION') {
            const progress = this.transitionTimer / 1.2;
            const alpha = Math.sin((1 - progress) * Math.PI);
            this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
        }
    }

    renderDebugCollisionBoundaries(ctx, startCol, endCol, startRow, endRow) {
        ctx.save();
        ctx.lineWidth = 1.5;

        // Player Hitbox (Cyan)
        const pBox = this.player.getHitbox();
        ctx.strokeStyle = '#00ffff';
        ctx.strokeRect(pBox.x, pBox.y, pBox.width, pBox.height);

        // Tile Hazards: Spikes (Red) and Lava (Orange)
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = this.currentLevel.getTile(c, r);
                if (tile === TILE_TYPES.SPIKE) {
                    ctx.strokeStyle = '#ff0055';
                    ctx.strokeRect(c * TILE_SIZE + 2, r * TILE_SIZE + 8, TILE_SIZE - 4, TILE_SIZE - 8);
                } else if (tile === TILE_TYPES.LAVA) {
                    ctx.strokeStyle = '#ff6600';
                    ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE + 4, TILE_SIZE, TILE_SIZE - 4);
                }
            }
        }

        // Exit Doorway Trigger (Gold)
        const exitBox = Physics.getExitDoorwayBox(this.currentLevel.exit);
        ctx.strokeStyle = '#ffd700';
        ctx.strokeRect(exitBox.x, exitBox.y, exitBox.width, exitBox.height);

        // Enemy Hitboxes (Magenta)
        ctx.strokeStyle = '#ff00ff';
        for (const e of this.enemies.enemies) {
            const eb = e.getHitbox();
            ctx.strokeRect(eb.x, eb.y, eb.width, eb.height);
        }

        ctx.restore();
    }
}

