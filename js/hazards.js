// js/hazards.js - Interactive and environmental hazards

import { Physics, TILE_SIZE } from './physics.js';
import { audioManager } from './audio.js';

export class HazardManager {
    constructor() {
        this.hazards = [];
        this.projectiles = [];
    }

    clear() {
        this.hazards = [];
        this.projectiles = [];
    }

    add(hazard) {
        this.hazards.push(hazard);
    }

    addProjectile(proj) {
        this.projectiles.push(proj);
    }

    update(dt, player, particleSystem) {
        // Update hazards (sawblades, fire jets, falling blocks)
        for (const h of this.hazards) {
            h.update(dt, player, particleSystem, this);
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, particleSystem);
            if (!p.alive) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    draw(ctx, animTimer) {
        for (const h of this.hazards) {
            h.draw(ctx, animTimer);
        }
        for (const p of this.projectiles) {
            p.draw(ctx, animTimer);
        }
    }

    checkPlayerCollision(player) {
        // Check hazards
        for (const h of this.hazards) {
            if (h.isActive() && Physics.checkAABB(player.getHitbox(), h.getHitbox())) {
                return h;
            }
        }
        // Check projectiles
        for (const p of this.projectiles) {
            if (Physics.checkAABB(player.getHitbox(), p.getHitbox())) {
                p.alive = false;
                return p;
            }
        }
        return null;
    }
}

// 1. Moving Sawblade on a linear patrol path
export class SawbladeHazard {
    constructor(x1, y1, x2, y2, speed = 80, radius = 14) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x = x1;
        this.y = y1;
        this.speed = speed;
        this.radius = radius;
        this.progress = 0;
        this.dir = 1;
        this.rotation = 0;
        this.dist = Math.hypot(x2 - x1, y2 - y1);
    }

    isActive() { return true; }

    getHitbox() {
        return {
            x: this.x - this.radius * 0.75,
            y: this.y - this.radius * 0.75,
            width: this.radius * 1.5,
            height: this.radius * 1.5
        };
    }

    update(dt, player, particleSystem) {
        this.rotation += dt * 12;
        if (this.dist > 0) {
            this.progress += (this.speed / this.dist) * dt * this.dir;
            if (this.progress >= 1) {
                this.progress = 1;
                this.dir = -1;
            } else if (this.progress <= 0) {
                this.progress = 0;
                this.dir = 1;
            }
            this.x = this.x1 + (this.x2 - this.x1) * this.progress;
            this.y = this.y1 + (this.y2 - this.y1) * this.progress;
        }
        if (Math.random() < 0.15) {
            particleSystem.spawnDust(this.x, this.y, 1, '#f1c40f');
        }
    }

    draw(ctx, animTimer) {
        // Draw track
        if (this.dist > 0) {
            ctx.strokeStyle = '#57606f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x1, this.y1);
            ctx.lineTo(this.x2, this.y2);
            ctx.stroke();

            // Track endcaps
            ctx.fillStyle = '#2f3542';
            ctx.beginPath();
            ctx.arc(this.x1, this.y1, 4, 0, Math.PI * 2);
            ctx.arc(this.x2, this.y2, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw sawblade
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(this.rotation);

        ctx.fillStyle = '#dfe4ea';
        ctx.beginPath();
        const teeth = 8;
        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
            const rOuter = this.radius;
            const rInner = this.radius * 0.65;
            if (i === 0) ctx.moveTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
            else ctx.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
            ctx.lineTo(Math.cos(nextAngle) * rInner, Math.sin(nextAngle) * rInner);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#747d8c';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Center hub
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 2. Timed Flame Jet (Cycles: Charging -> Active Beam -> Off)
export class FlameJetHazard {
    constructor(x, y, dir = 'up', onDuration = 1.5, offDuration = 2.0, length = 64) {
        this.x = x;
        this.y = y;
        this.dir = dir; // 'up', 'down', 'left', 'right'
        this.onDuration = onDuration;
        this.offDuration = offDuration;
        this.length = length;
        this.timer = Math.random() * (onDuration + offDuration); // desync
        this.state = 'off'; // 'off', 'warning', 'active'
    }

    isActive() {
        return this.state === 'active';
    }

    getHitbox() {
        if (!this.isActive()) return { x: -999, y: -999, width: 0, height: 0 };
        const w = 18;
        if (this.dir === 'up') return { x: this.x + 7, y: this.y - this.length, width: w, height: this.length };
        if (this.dir === 'down') return { x: this.x + 7, y: this.y + TILE_SIZE, width: w, height: this.length };
        if (this.dir === 'left') return { x: this.x - this.length, y: this.y + 7, width: this.length, height: w };
        if (this.dir === 'right') return { x: this.x + TILE_SIZE, y: this.y + 7, width: this.length, height: w };
        return { x: this.x, y: this.y, width: TILE_SIZE, height: TILE_SIZE };
    }

    update(dt, player, particleSystem) {
        this.timer += dt;
        const totalCycle = this.onDuration + this.offDuration;
        const cyclePos = this.timer % totalCycle;

        if (cyclePos < this.offDuration - 0.5) {
            this.state = 'off';
        } else if (cyclePos < this.offDuration) {
            this.state = 'warning';
            // Spawn warning spark
            if (Math.random() < 0.3) {
                particleSystem.spawnDust(this.x + 16, this.y + 16, 1, '#f39c12');
            }
        } else {
            this.state = 'active';
            // Spawn flame particles
            if (Math.random() < 0.6) {
                const px = this.x + 16 + (Math.random() - 0.5) * 8;
                const py = this.y + (this.dir === 'up' ? -Math.random() * this.length : 16);
                particleSystem.spawnAmbientEmber(px, py, '#e74c3c');
            }
        }
    }

    draw(ctx, animTimer) {
        // Draw emitter nozzle
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 4, this.y + 4, 24, 24);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(this.x + 8, this.y + 8, 16, 16);

        if (this.state === 'warning') {
            // Glowing warning indicator
            ctx.fillStyle = Math.floor(animTimer * 10) % 2 === 0 ? '#e74c3c' : '#f1c40f';
            ctx.beginPath();
            ctx.arc(this.x + 16, this.y + 16, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.state === 'active') {
            // Draw roaring animated flame plume
            ctx.save();
            const flicker = Math.sin(animTimer * 30) * 4;
            const hb = this.getHitbox();
            const grad = ctx.createLinearGradient(
                this.dir === 'up' || this.dir === 'down' ? hb.x : hb.x + hb.width,
                this.dir === 'up' ? hb.y + hb.height : hb.y,
                this.dir === 'up' || this.dir === 'down' ? hb.x : hb.x,
                this.dir === 'up' ? hb.y : hb.y + hb.height
            );

            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#f1c40f');
            grad.addColorStop(0.7, '#e67e22');
            grad.addColorStop(1.0, 'rgba(231, 76, 60, 0)');

            ctx.fillStyle = grad;
            if (this.dir === 'up') {
                ctx.beginPath();
                ctx.moveTo(this.x + 6, this.y);
                ctx.lineTo(this.x + 16 + flicker, this.y - this.length);
                ctx.lineTo(this.x + 26, this.y);
                ctx.closePath();
                ctx.fill();
            } else if (this.dir === 'down') {
                ctx.beginPath();
                ctx.moveTo(this.x + 6, this.y + TILE_SIZE);
                ctx.lineTo(this.x + 16 + flicker, this.y + TILE_SIZE + this.length);
                ctx.lineTo(this.x + 26, this.y + TILE_SIZE);
                ctx.closePath();
                ctx.fill();
            } else if (this.dir === 'left') {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 6);
                ctx.lineTo(this.x - this.length, this.y + 16 + flicker);
                ctx.lineTo(this.x, this.y + 26);
                ctx.closePath();
                ctx.fill();
            } else if (this.dir === 'right') {
                ctx.beginPath();
                ctx.moveTo(this.x + TILE_SIZE, this.y + 6);
                ctx.lineTo(this.x + TILE_SIZE + this.length, this.y + 16 + flicker);
                ctx.lineTo(this.x + TILE_SIZE, this.y + 26);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

// 3. Turret / Energy Projectile
export class Projectile {
    constructor(x, y, vx, vy, color = '#ff4757', radius = 5, life = 4.0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.radius = radius;
        this.life = life;
        this.alive = true;
    }

    getHitbox() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }

    update(dt, particleSystem) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) {
            this.alive = false;
        }
        if (Math.random() < 0.3) {
            particleSystem.spawnDust(this.x, this.y, 1, this.color);
        }
    }

    draw(ctx, animTimer) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.round(this.x), Math.round(this.y), this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

