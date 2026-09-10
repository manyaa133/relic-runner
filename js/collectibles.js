// js/collectibles.js - Items, Keys, Relics, and Extra Life Pickups

import { Physics, TILE_SIZE } from './physics.js';
import { audioManager } from './audio.js';

export class Collectible {
    constructor(x, y, type, id = '') {
        this.x = x;
        this.y = y;
        this.type = type; // 'coin', 'gem', 'extra_life', 'key', 'relic'
        this.id = id;
        this.width = 18;
        this.height = 18;
        this.collected = false;
        this.baseY = y;
        this.animOffset = Math.random() * Math.PI * 2;
    }

    getHitbox() {
        return {
            x: this.x + (TILE_SIZE - this.width) / 2,
            y: this.y + (TILE_SIZE - this.height) / 2,
            width: this.width,
            height: this.height
        };
    }

    update(dt) {
        if (this.collected) return;
        // Gentle hovering
        this.animOffset += dt * 3;
        this.y = this.baseY + Math.sin(this.animOffset) * 3;
    }

    collect(player, particleSystem, game) {
        if (this.collected) return false;
        this.collected = true;

        const centerX = this.x + TILE_SIZE / 2;
        const centerY = this.y + TILE_SIZE / 2;

        switch (this.type) {
            case 'coin':
                game.addScore(100);
                game.addCoin();
                audioManager.playSfx('coin');
                particleSystem.spawnCollectSparkles(centerX, centerY, '#f1c40f', 8);
                break;
            case 'gem':
                game.addScore(500);
                game.addGem();
                audioManager.playSfx('gem');
                particleSystem.spawnCollectSparkles(centerX, centerY, '#00d2d3', 12);
                break;
            case 'extra_life':
                const gained = player.addLife(1);
                game.addScore(1000);
                audioManager.playSfx('extra_life');
                particleSystem.spawnExtraLifeBurst(centerX, centerY);
                game.showFloatingText('+1 EXTRA LIFE!', centerX, centerY - 10, '#ff4757');
                break;
            case 'key':
                game.addKey(this.id);
                audioManager.playSfx('key');
                particleSystem.spawnCollectSparkles(centerX, centerY, '#feca57', 14);
                game.showFloatingText('KEY ACQUIRED!', centerX, centerY - 10, '#feca57');
                break;
            case 'relic':
                game.hasRelic = true;
                game.addScore(2500);
                audioManager.playSfx('level_complete');
                particleSystem.spawnCollectSparkles(centerX, centerY, '#ffd32a', 25);
                game.showFloatingText('SACRED RELIC CLAIMED! EXIT OPEN!', centerX, centerY - 15, '#ffd32a');
                break;
        }

        return true;
    }

    draw(ctx, animTimer) {
        if (this.collected) return;

        const cx = Math.round(this.x + TILE_SIZE / 2);
        const cy = Math.round(this.y + TILE_SIZE / 2);

        ctx.save();
        ctx.translate(cx, cy);

        switch (this.type) {
            case 'coin': {
                // Spinning 3D gold coin
                const scaleX = Math.cos(animTimer * 5 + this.animOffset);
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.ellipse(0, 0, Math.abs(scaleX) * 7 + 1, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#d35400';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Shine line
                if (Math.abs(scaleX) > 0.4) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-1, -4, 2, 8);
                }
                break;
            }
            case 'gem': {
                // Sparkling faceted gemstone
                ctx.fillStyle = '#00d2d3';
                ctx.beginPath();
                ctx.moveTo(0, -9);
                ctx.lineTo(8, -2);
                ctx.lineTo(0, 9);
                ctx.lineTo(-8, -2);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#54a0ff';
                ctx.beginPath();
                ctx.moveTo(0, -9);
                ctx.lineTo(8, -2);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();

                // Highlight
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(0, -9);
                ctx.lineTo(-4, -4);
                ctx.lineTo(0, -2);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'extra_life': {
                // Glowing pulsating heart
                const pulse = 1 + Math.sin(animTimer * 6) * 0.12;
                ctx.scale(pulse, pulse);

                // Heart glow aura
                ctx.fillStyle = 'rgba(255, 71, 87, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 14, 0, Math.PI * 2);
                ctx.fill();

                // Heart body
                ctx.fillStyle = '#ff4757';
                ctx.beginPath();
                ctx.moveTo(0, 6);
                ctx.bezierCurveTo(-9, 1, -9, -7, -4, -7);
                ctx.bezierCurveTo(-1, -7, 0, -3, 0, -3);
                ctx.bezierCurveTo(0, -3, 1, -7, 4, -7);
                ctx.bezierCurveTo(9, -7, 9, 1, 0, 6);
                ctx.fill();

                // Specular glint
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-3, -4, 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'key': {
                // Golden Ancient Key
                ctx.fillStyle = '#feca57';
                ctx.strokeStyle = '#d35400';
                ctx.lineWidth = 1.5;

                // Ring
                ctx.beginPath();
                ctx.arc(0, -5, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();

                ctx.fillStyle = '#2f3542';
                ctx.beginPath();
                ctx.arc(0, -5, 2, 0, Math.PI * 2);
                ctx.fill();

                // Stem & Teeth
                ctx.fillStyle = '#feca57';
                ctx.fillRect(-1.5, 0, 3, 9);
                ctx.fillRect(1, 4, 3, 2);
                ctx.fillRect(1, 7, 3, 2);
                break;
            }
            case 'relic': {
                // Sacred Golden Idol / Relic
                const glow = Math.sin(animTimer * 4) * 0.2 + 0.8;
                ctx.fillStyle = `rgba(255, 211, 42, ${0.4 * glow})`;
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();

                // Pedestal & Chalice
                ctx.fillStyle = '#ffd32a';
                ctx.fillRect(-6, 4, 12, 4); // base
                ctx.fillRect(-2, 0, 4, 5);  // stem
                ctx.beginPath();
                ctx.arc(0, -3, 7, 0, Math.PI); // cup
                ctx.fill();

                // Crown jewels
                ctx.fillStyle = '#ff4757';
                ctx.fillRect(-2, -5, 4, 4);
                break;
            }
        }

        ctx.restore();
    }
}

