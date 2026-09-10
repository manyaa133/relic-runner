// js/enemies.js - Original Enemy AI Classes, Hitboxes, and Stomp Resolution

import { Physics, TILE_SIZE, TILE_TYPES } from './physics.js';
import { audioManager } from './audio.js';

export class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    clear() {
        this.enemies = [];
    }

    add(enemy) {
        this.enemies.push(enemy);
    }

    update(dt, level, player, particleSystem, hazardManager) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, level, player, particleSystem, hazardManager);
            if (!e.alive) {
                this.enemies.splice(i, 1);
            }
        }
    }

    draw(ctx, animTimer) {
        for (const e of this.enemies) {
            e.draw(ctx, animTimer);
        }
    }

    checkPlayerInteractions(player, particleSystem, game) {
        if (player.invulnerableTimer > 0 || player.isDead) return;

        const playerBox = player.getHitbox();

        for (const e of this.enemies) {
            if (!e.alive) continue;

            const enemyBox = e.getHitbox();
            if (Physics.checkAABB(playerBox, enemyBox)) {
                // Stomp condition: Player must be falling (vy > 0) and player feet near enemy head
                const playerFeet = playerBox.y + playerBox.height;
                const enemyHead = enemyBox.y + enemyBox.height * 0.45;

                if (player.vy > 0 && playerFeet <= enemyHead + 8 && e.canBeStomped) {
                    // STOMP VICTORY
                    e.defeat(particleSystem, game);
                    player.vy = -340; // Bounce upwards
                    player.onGround = false;
                    audioManager.playSfx('stomp');
                    game.addScore(300);
                    game.showFloatingText('+300', e.x + e.width / 2, e.y - 10, '#feca57');
                    return;
                } else {
                    // PLAYER TAKES DAMAGE / DIES
                    player.takeDamage(1, game, particleSystem);
                    return;
                }
            }
        }
    }
}

// ==========================================
// 1. SLIME CRAWLER (Patrols Ledges & Floors)
// ==========================================
export class SlimeCrawler {
    constructor(x, y, speed = 50, color = '#2ed573') {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 18;
        this.speed = speed;
        this.vx = speed;
        this.vy = 0;
        this.color = color;
        this.alive = true;
        this.canBeStomped = true;
        this.facing = 1;
        this.animTimer = Math.random() * 5;
    }

    getHitbox() {
        return {
            x: this.x + 2,
            y: this.y + 2,
            width: this.width - 4,
            height: this.height - 2
        };
    }

    update(dt, level, player, particleSystem) {
        this.animTimer += dt;
        this.vy += 1000 * dt; // gravity

        // Check ledge ahead before moving
        const checkX = this.vx > 0 ? this.x + this.width + 2 : this.x - 2;
        const groundCheckTileC = Math.floor(checkX / TILE_SIZE);
        const groundCheckTileR = Math.floor((this.y + this.height + 4) / TILE_SIZE);

        const groundTile = level.getTile(groundCheckTileC, groundCheckTileR);
        const isLedge = (groundTile === TILE_TYPES.EMPTY || groundTile === TILE_TYPES.SPIKE || groundTile === TILE_TYPES.LAVA);

        // Check wall ahead
        const wallCheckTileR = Math.floor((this.y + this.height / 2) / TILE_SIZE);
        const wallTile = level.getTile(groundCheckTileC, wallCheckTileR);
        const isWall = (wallTile === TILE_TYPES.SOLID || wallTile === TILE_TYPES.LOCKED_DOOR);

        if (isLedge || isWall) {
            this.vx = -this.vx;
            this.facing = this.vx > 0 ? 1 : -1;
        }

        Physics.updateEntityTileCollisions(this, level, dt);
    }

    defeat(particleSystem, game) {
        this.alive = false;
        particleSystem.spawnEnemyDefeat(this.x + this.width / 2, this.y + this.height / 2, this.color);
    }

    draw(ctx, animTimer) {
        const squish = Math.sin(this.animTimer * 10) * 2;
        const cx = Math.round(this.x + this.width / 2);
        const cy = Math.round(this.y + this.height);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.facing, 1);

        // Slime Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 2, this.width / 2 + squish * 0.5, this.height / 2 - squish * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-2, -this.height * 0.7, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, -this.height * 0.65, 4, 4);
        ctx.fillRect(8, -this.height * 0.65, 4, 4);
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(4, -this.height * 0.6, 2, 2);
        ctx.fillRect(10, -this.height * 0.6, 2, 2);

        ctx.restore();
    }
}

// ==========================================
// 2. CAVE GLIDER (Flying Bat / Sine Drone)
// ==========================================
export class CaveGlider {
    constructor(x, y, range = 120, speed = 70, color = '#a55eea') {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 26;
        this.height = 18;
        this.range = range;
        this.speed = speed;
        this.color = color;
        this.alive = true;
        this.canBeStomped = true;
        this.facing = 1;
        this.time = Math.random() * 5;
    }

    getHitbox() {
        return {
            x: this.x + 2,
            y: this.y + 2,
            width: this.width - 4,
            height: this.height - 4
        };
    }

    update(dt, level, player, particleSystem) {
        this.time += dt;
        // Horizontal patrol
        this.x = this.startX + Math.sin(this.time * (this.speed / 40)) * this.range;
        // Sine wave vertical bobbing
        this.y = this.startY + Math.sin(this.time * 4) * 16;
        this.facing = Math.cos(this.time * (this.speed / 40)) > 0 ? 1 : -1;
    }

    defeat(particleSystem, game) {
        this.alive = false;
        particleSystem.spawnEnemyDefeat(this.x + this.width / 2, this.y + this.height / 2, this.color);
    }

    draw(ctx, animTimer) {
        const wingFlap = Math.sin(this.time * 14) * 6;
        const cx = Math.round(this.x + this.width / 2);
        const cy = Math.round(this.y + this.height / 2);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.facing, 1);

        // Wings
        ctx.fillStyle = '#778ca3';
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-14, -8 + wingFlap);
        ctx.lineTo(-6, 4);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(14, -8 + wingFlap);
        ctx.lineTo(6, 4);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red eyes
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(2, -2, 2, 2);
        ctx.fillRect(5, -2, 2, 2);

        ctx.restore();
    }
}

// ==========================================
// 3. PLASMA TURRET (Aims & Shoots Projectiles)
// ==========================================
export class PlasmaTurret {
    constructor(x, y, dir = -1, fireInterval = 2.5) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.dir = dir; // 1 = right, -1 = left
        this.fireInterval = fireInterval;
        this.fireTimer = Math.random() * fireInterval;
        this.alive = true;
        this.canBeStomped = true;
    }

    getHitbox() {
        return {
            x: this.x + 2,
            y: this.y + 4,
            width: this.width - 4,
            height: this.height - 4
        };
    }

    update(dt, level, player, particleSystem, hazardManager) {
        this.fireTimer += dt;
        if (this.fireTimer >= this.fireInterval) {
            this.fireTimer = 0;
            // Fire projectile
            const projX = this.dir > 0 ? this.x + this.width + 4 : this.x - 4;
            const projY = this.y + this.height / 2;
            const projVx = this.dir * 160;

            // Import projectile dynamically through hazardManager
            hazardManager.addProjectile(
                new (hazardManager.constructor.prototype.constructor.Projectile || 
                     window.HazardProjectile || 
                     (class {
                        constructor(px, py, pvx, pvy) {
                            this.x = px; this.y = py; this.vx = pvx; this.vy = pvy;
                            this.color = '#ff4757'; this.radius = 5; this.life = 4.0; this.alive = true;
                        }
                        getHitbox() { return { x: this.x - 5, y: this.y - 5, width: 10, height: 10 }; }
                        update(pdt, ps) { this.x += this.vx * pdt; this.life -= pdt; if (this.life <= 0) this.alive = false; }
                        draw(pctx) {
                            pctx.fillStyle = '#ff4757'; pctx.beginPath(); pctx.arc(this.x, this.y, 5, 0, Math.PI*2); pctx.fill();
                            pctx.fillStyle = '#ffffff'; pctx.beginPath(); pctx.arc(this.x, this.y, 2, 0, Math.PI*2); pctx.fill();
                        }
                     })
                )(projX, projY, projVx, 0)
            );
            audioManager.playSfx('laser');
            particleSystem.spawnDust(projX, projY, 3, '#ff4757');
        }
    }

    defeat(particleSystem, game) {
        this.alive = false;
        particleSystem.spawnDeathExplosion(this.x + this.width / 2, this.y + this.height / 2, '#485460');
    }

    draw(ctx, animTimer) {
        const cx = Math.round(this.x + this.width / 2);
        const cy = Math.round(this.y + this.height / 2);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.dir, 1);

        // Base
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-10, -10, 20, 20);

        // Barrel
        ctx.fillStyle = '#57606f';
        ctx.fillRect(2, -4, 10, 8);

        // Charging eye
        const isCharging = this.fireTimer > this.fireInterval - 0.6;
        ctx.fillStyle = isCharging ? '#ff4757' : '#ffa502';
        ctx.beginPath();
        ctx.arc(-2, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// 4. LEAP HOPPER (Jumping Bug)
// ==========================================
export class LeapHopper {
    constructor(x, y, color = '#ff6b81') {
        this.x = x;
        this.y = y;
        this.width = 22;
        this.height = 20;
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.alive = true;
        this.canBeStomped = true;
        this.onGround = true;
        this.jumpCooldown = 1.8;
        this.timer = Math.random() * 1.5;
        this.facing = 1;
    }

    getHitbox() {
        return {
            x: this.x + 2,
            y: this.y + 2,
            width: this.width - 4,
            height: this.height - 2
        };
    }

    update(dt, level, player, particleSystem) {
        this.vy += 1100 * dt; // Gravity
        this.timer += dt;

        // Jump when on ground and timer ready
        if (this.onGround) {
            this.vx = 0;
            if (this.timer >= this.jumpCooldown) {
                this.timer = 0;
                this.vy = -360;
                // Leap towards player if within range
                const distToPlayer = player.x - this.x;
                if (Math.abs(distToPlayer) < 300) {
                    this.facing = distToPlayer > 0 ? 1 : -1;
                    this.vx = this.facing * 110;
                } else {
                    this.vx = this.facing * 90;
                }
                particleSystem.spawnJumpPuff(this.x + this.width / 2, this.y + this.height, '#ff6b81');
            }
        }

        Physics.updateEntityTileCollisions(this, level, dt);
    }

    defeat(particleSystem, game) {
        this.alive = false;
        particleSystem.spawnEnemyDefeat(this.x + this.width / 2, this.y + this.height / 2, this.color);
    }

    draw(ctx, animTimer) {
        const cx = Math.round(this.x + this.width / 2);
        const cy = Math.round(this.y + this.height);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.facing, 1);

        const crouch = (this.onGround && this.timer > this.jumpCooldown - 0.4) ? 3 : 0;

        // Shell
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + crouch, this.width / 2, Math.PI, 0);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -4 + crouch);
        ctx.lineTo(-10, 0);
        ctx.moveTo(6, -4 + crouch);
        ctx.lineTo(10, 0);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, -this.height * 0.6 + crouch, 3, 3);
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(4, -this.height * 0.55 + crouch, 2, 2);

        ctx.restore();
    }
}

