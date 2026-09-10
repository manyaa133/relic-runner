// js/player.js - Player State Machine, Physics, Coyote-Time & Jump Buffering

import { Physics, TILE_SIZE, TILE_TYPES } from './physics.js';
import { CHARACTERS, CharacterRenderer } from './characters.js';
import { audioManager } from './audio.js';

export class Player {
    constructor(characterId = 'explorer') {
        this.setCharacter(characterId);

        this.x = 64;
        this.y = 120;
        this.width = 20;
        this.height = 28;

        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.onGround = false;
        this.wasOnGround = false;

        // Base physics constants
        this.baseMaxSpeed = 230;
        this.acceleration = 1600;
        this.deceleration = 1900;
        this.airControl = 1300;
        this.gravity = 1200;
        this.maxFallSpeed = 520;
        this.baseJumpVelocity = -435;

        // Mechanics Tuning
        this.coyoteTimeMax = 0.12; // 120ms
        this.coyoteTimer = 0;
        this.jumpBufferMax = 0.14; // 140ms
        this.jumpBufferTimer = 0;
        this.isJumping = false;

        // Health & Lives
        this.maxLives = 6;
        this.lives = this.character.startingLives;
        this.invulnerableTimer = 0;
        this.isDead = false;
        this.deathTimer = 0;

        // Animation & Visuals
        this.state = 'idle'; // 'idle', 'run', 'jump', 'fall', 'hurt', 'dead'
        this.animTimer = 0;
        this.stepTimer = 0;

        // Checkpoint spawn reference
        this.checkpointPos = { x: 64, y: 120 };
    }

    setCharacter(characterId) {
        this.characterId = characterId;
        this.character = CHARACTERS[characterId] || CHARACTERS.explorer;
        this.lives = this.character.startingLives;
    }

    spawnAt(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.isDead = false;
        this.deathTimer = 0;
        this.invulnerableTimer = 0.5;
        this.state = 'idle';
    }

    setCheckpoint(x, y) {
        this.checkpointPos = { x, y };
    }

    respawnAtCheckpoint() {
        this.spawnAt(this.checkpointPos.x, this.checkpointPos.y);
        this.invulnerableTimer = this.character.invulnerabilityDuration;
    }

    getHitbox() {
        return {
            x: this.x + 2,
            y: this.y + 2,
            width: this.width - 4,
            height: this.height - 2
        };
    }

    addLife(count = 1) {
        if (this.lives < this.maxLives) {
            this.lives = Math.min(this.maxLives, this.lives + count);
            return true;
        }
        return false;
    }

    takeDamage(amount, game, particleSystem) {
        if (this.invulnerableTimer > 0 || this.isDead) return;

        this.die(game, particleSystem);
    }

    die(game, particleSystem) {
        if (this.isDead) return;

        this.isDead = true;
        this.deathTimer = 0.9;
        this.vx = 0;
        this.vy = -200;
        this.state = 'hurt';

        audioManager.playSfx('hurt');
        audioManager.playSfx('death');
        game.camera.triggerShake(8, 0.4);

        particleSystem.spawnDeathExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.character.colors.primary
        );

        game.onPlayerDied();
    }

    update(dt, input, level, movingPlatforms, particleSystem, game) {
        this.animTimer += dt;

        // Handle death state
        if (this.isDead) {
            this.deathTimer -= dt;
            this.vy += this.gravity * 0.7 * dt;
            this.y += this.vy * dt;
            if (this.deathTimer <= 0) {
                game.handleRespawnOrGameOver();
            }
            return;
        }

        // Handle invulnerability countdown
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        const maxSpeed = this.baseMaxSpeed * this.character.speedMultiplier;
        const jumpVelocity = this.baseJumpVelocity * this.character.jumpMultiplier;

        // 1. HORIZONTAL INPUT & ACCELERATION
        let moveX = 0;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;

        if (moveX !== 0) {
            this.facing = moveX > 0 ? 1 : -1;
            const accel = this.onGround ? this.acceleration : this.airControl;
            this.vx += moveX * accel * dt;
            if (Math.abs(this.vx) > maxSpeed) {
                this.vx = moveX * maxSpeed;
            }

            // Running dust & footstep sounds
            if (this.onGround) {
                this.stepTimer += dt;
                if (this.stepTimer >= 0.22) {
                    this.stepTimer = 0;
                    particleSystem.spawnDust(
                        this.x + (this.facing > 0 ? 2 : this.width - 2),
                        this.y + this.height,
                        2,
                        this.character.colors.particles
                    );
                }
            }
        } else {
            // Crisp deceleration (no sliding)
            const decel = this.onGround ? this.deceleration : this.airControl * 0.8;
            if (this.vx > 0) {
                this.vx = Math.max(0, this.vx - decel * dt);
            } else if (this.vx < 0) {
                this.vx = Math.min(0, this.vx + decel * dt);
            }
        }

        // 2. COYOTE TIME & JUMP BUFFERING
        if (this.onGround) {
            this.coyoteTimer = this.coyoteTimeMax;
            this.isJumping = false;
        } else {
            this.coyoteTimer -= dt;
        }

        if (input.jumpJustPressed) {
            this.jumpBufferTimer = this.jumpBufferMax;
        } else {
            this.jumpBufferTimer -= dt;
        }

        // Execute Jump (can trigger from ground or via coyote time / buffered jump)
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isJumping) {
            this.vy = jumpVelocity;
            this.onGround = false;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            this.isJumping = true;

            audioManager.playSfx('jump');
            particleSystem.spawnJumpPuff(
                this.x + this.width / 2,
                this.y + this.height,
                this.character.colors.particles
            );
        }

        // Variable Jump Height (cut upward velocity on button release)
        if (!input.jumpPressed && this.vy < -150) {
            this.vy *= 0.62;
        }

        // 3. GRAVITY & TERMINAL VELOCITY
        this.vy += this.gravity * dt;
        if (this.vy > this.maxFallSpeed) {
            this.vy = this.maxFallSpeed;
        }

        // 4. PHYSICS COLLISION INTEGRATION
        const prevOnGround = this.onGround;
        Physics.updateEntityTileCollisions(this, level, dt, movingPlatforms);

        // Landing impact
        if (!prevOnGround && this.onGround) {
            audioManager.playSfx('land');
            particleSystem.spawnDust(this.x + this.width / 2, this.y + this.height, 4, '#ffffff');
        }

        // 5. PIT DEATH CHECK
        if (this.y > level.heightInTiles * TILE_SIZE + 40) {
            this.die(game, particleSystem);
        }

        // 6. ANIMATION STATE SELECTION
        if (!this.onGround) {
            this.state = this.vy < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.vx) > 15) {
            this.state = 'run';
        } else {
            this.state = 'idle';
        }
    }

    draw(ctx) {
        if (this.isDead && this.deathTimer < 0.6) return; // Disintegrated

        CharacterRenderer.draw(
            ctx,
            this.characterId,
            this.x,
            this.y,
            this.width,
            this.height,
            this.state,
            this.facing,
            this.animTimer,
            this.invulnerableTimer > 0
        );
    }
}

