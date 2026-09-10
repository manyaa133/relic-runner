// js/checkpoints.js - Checkpoint Totem Entity & Respawn Logic

import { Physics, TILE_SIZE } from './physics.js';
import { audioManager } from './audio.js';

export class Checkpoint {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE * 1.5;
        this.active = false;
        this.glowTimer = 0;
    }

    getHitbox() {
        return {
            x: this.x + 4,
            y: this.y,
            width: this.width - 8,
            height: this.height
        };
    }

    getRespawnPosition() {
        // Return safe position right next to / in front of checkpoint
        return {
            x: this.x + 2,
            y: this.y + this.height - 30
        };
    }

    activate(particleSystem, game) {
        if (this.active) return false;

        this.active = true;
        audioManager.playSfx('checkpoint');
        particleSystem.spawnCheckpointActivation(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
        game.showFloatingText('CHECKPOINT ACTIVATED!', this.x + TILE_SIZE / 2, this.y - 15, '#00d2d3');
        return true;
    }

    update(dt, particleSystem) {
        this.glowTimer += dt;
        if (this.active && Math.random() < 0.25) {
            particleSystem.spawnAmbientEmber(
                this.x + 8 + Math.random() * 16,
                this.y + 10 + Math.random() * 20,
                '#00d2d3'
            );
        }
    }

    draw(ctx, animTimer) {
        const cx = Math.round(this.x);
        const cy = Math.round(this.y);

        ctx.save();
        ctx.translate(cx, cy);

        // 1. Stone Base
        ctx.fillStyle = '#485460';
        ctx.fillRect(4, this.height - 8, 24, 8);
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(8, this.height - 18, 16, 10);

        // 2. Pillar Body
        ctx.fillStyle = '#57606f';
        ctx.fillRect(10, 8, 12, this.height - 26);

        // 3. Totem Orb / Crystal Beacon
        const beaconY = 8;
        if (this.active) {
            // Glowing Active Orb + Floating Rings
            const pulse = Math.sin(animTimer * 5) * 2;
            const glowAlpha = 0.35 + Math.sin(animTimer * 4) * 0.15;

            // Halo
            ctx.fillStyle = `rgba(0, 210, 211, ${glowAlpha})`;
            ctx.beginPath();
            ctx.arc(16, beaconY, 14 + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Orb
            ctx.fillStyle = '#00d2d3';
            ctx.beginPath();
            ctx.arc(16, beaconY, 7, 0, Math.PI * 2);
            ctx.fill();

            // Inner Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(16, beaconY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Runes on pillar
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(13, 18, 6, 2);
            ctx.fillRect(14, 23, 4, 2);
            ctx.fillRect(13, 28, 6, 2);
        } else {
            // Dormant Inactive Totem
            ctx.fillStyle = '#747d8c';
            ctx.beginPath();
            ctx.arc(16, beaconY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#a4b0be';
            ctx.beginPath();
            ctx.arc(16, beaconY, 2, 0, Math.PI * 2);
            ctx.fill();

            // Faint unlit runes
            ctx.fillStyle = '#3d3d3d';
            ctx.fillRect(14, 18, 4, 2);
            ctx.fillRect(14, 24, 4, 2);
        }

        ctx.restore();
    }
}

