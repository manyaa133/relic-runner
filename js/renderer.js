// js/renderer.js - Procedural Pixel-Art Tileset & Parallax Environment Renderer

import { TILE_SIZE, TILE_TYPES } from './physics.js';

export class LevelRenderer {
    static drawBackground(ctx, theme, camera, viewWidth, viewHeight, animTimer) {
        ctx.save();

        switch (theme) {
            case 'forest': {
                // 1. Sky Gradient
                const skyGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
                skyGrad.addColorStop(0, '#74b9ff');
                skyGrad.addColorStop(1, '#dfe6e9');
                ctx.fillStyle = skyGrad;
                ctx.fillRect(0, 0, viewWidth, viewHeight);

                // 2. Distant Mountains (Parallax 0.1)
                ctx.fillStyle = '#a4b0be';
                ctx.beginPath();
                const mtnOffset = -(camera.x * 0.1) % 400;
                for (let x = mtnOffset - 400; x < viewWidth + 400; x += 300) {
                    ctx.moveTo(x, viewHeight);
                    ctx.lineTo(x + 150, viewHeight - 160);
                    ctx.lineTo(x + 300, viewHeight);
                }
                ctx.fill();

                // 3. Midground Lush Forest Canopies (Parallax 0.3)
                ctx.fillStyle = '#2ed573';
                const treeOffset = -(camera.x * 0.3) % 200;
                for (let x = treeOffset - 200; x < viewWidth + 200; x += 120) {
                    ctx.beginPath();
                    ctx.arc(x + 60, viewHeight - 60, 70, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fillStyle = '#26af5f';
                for (let x = treeOffset - 160; x < viewWidth + 200; x += 140) {
                    ctx.beginPath();
                    ctx.arc(x + 70, viewHeight - 40, 60, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            case 'temple': {
                // Dark Ancient Catacombs
                const grad = ctx.createLinearGradient(0, 0, 0, viewHeight);
                grad.addColorStop(0, '#1e272e');
                grad.addColorStop(1, '#2f3542');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, viewWidth, viewHeight);

                // Distant Stone Arches & Pillars (Parallax 0.2)
                ctx.fillStyle = '#353b48';
                const archOffset = -(camera.x * 0.2) % 180;
                for (let x = archOffset - 180; x < viewWidth + 180; x += 160) {
                    ctx.fillRect(x + 20, 40, 24, viewHeight);
                    ctx.beginPath();
                    ctx.arc(x + 80, 100, 60, Math.PI, 0);
                    ctx.fill();
                }
                break;
            }

            case 'magma': {
                // Subterranean Magma Cavern
                const grad = ctx.createLinearGradient(0, 0, 0, viewHeight);
                grad.addColorStop(0, '#2d142c');
                grad.addColorStop(0.6, '#510a32');
                grad.addColorStop(1, '#801336');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, viewWidth, viewHeight);

                // Glowing Molten Heat Haze in background
                const heatGlow = Math.sin(animTimer * 2) * 0.1 + 0.3;
                ctx.fillStyle = `rgba(238, 77, 45, ${heatGlow})`;
                ctx.fillRect(0, viewHeight - 120, viewWidth, 120);

                // Dark basalt crags (Parallax 0.25)
                ctx.fillStyle = '#1f1322';
                const cragOffset = -(camera.x * 0.25) % 250;
                for (let x = cragOffset - 250; x < viewWidth + 250; x += 200) {
                    ctx.beginPath();
                    ctx.moveTo(x, viewHeight);
                    ctx.lineTo(x + 80, viewHeight - 140);
                    ctx.lineTo(x + 120, viewHeight - 90);
                    ctx.lineTo(x + 200, viewHeight);
                    ctx.fill();
                }
                break;
            }

            case 'crystal': {
                // Cosmic Astral Night with Glowing Crystals
                const grad = ctx.createLinearGradient(0, 0, 0, viewHeight);
                grad.addColorStop(0, '#0c102b');
                grad.addColorStop(0.6, '#182352');
                grad.addColorStop(1, '#3b2d71');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, viewWidth, viewHeight);

                // Twinkling background stars
                for (let i = 0; i < 30; i++) {
                    const starX = (i * 97 - camera.x * 0.05) % viewWidth;
                    const starY = (i * 53) % (viewHeight * 0.75);
                    const twinkle = Math.sin(animTimer * 4 + i) * 0.4 + 0.6;
                    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
                    ctx.fillRect(starX < 0 ? starX + viewWidth : starX, starY, 2, 2);
                }

                // Aurora borealis wave
                const wave = Math.sin(animTimer + camera.x * 0.002) * 30;
                const auroraGrad = ctx.createLinearGradient(0, 50, 0, 180);
                auroraGrad.addColorStop(0, 'rgba(0, 210, 211, 0.15)');
                auroraGrad.addColorStop(1, 'rgba(165, 94, 234, 0)');
                ctx.fillStyle = auroraGrad;
                ctx.fillRect(0, 40 + wave, viewWidth, 120);
                break;
            }
        }

        ctx.restore();
    }

    static drawTiles(ctx, level, startCol, endCol, startRow, endRow, animTimer) {
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = level.getTile(c, r);
                if (tile === TILE_TYPES.EMPTY) continue;

                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                this.drawSingleTile(ctx, tile, x, y, c, r, level, animTimer);
            }
        }
    }

    static drawSingleTile(ctx, tile, x, y, c, r, level, animTimer) {
        const theme = level.theme;

        switch (tile) {
            case TILE_TYPES.SOLID: {
                // Render themed block with grass/rim on top if air above
                const isTop = (level.getTile(c, r - 1) !== TILE_TYPES.SOLID);

                if (theme === 'forest') {
                    // Earth brown with lush green top grass
                    ctx.fillStyle = '#574b32';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    // Earth texture specks
                    ctx.fillStyle = '#443a27';
                    ctx.fillRect(x + 6, y + 12, 4, 4);
                    ctx.fillRect(x + 18, y + 20, 6, 4);

                    if (isTop) {
                        ctx.fillStyle = '#2ed573';
                        ctx.fillRect(x, y, TILE_SIZE, 6);
                        ctx.fillStyle = '#26af5f';
                        ctx.fillRect(x + 4, y + 6, 5, 3);
                        ctx.fillRect(x + 16, y + 6, 6, 4);
                    }
                } else if (theme === 'temple') {
                    // Ancient carved stone brick
                    ctx.fillStyle = '#485460';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#2f3542';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    // Rune line
                    ctx.fillStyle = '#57606f';
                    ctx.fillRect(x + 4, y + 15, TILE_SIZE - 8, 2);
                    if (isTop) {
                        ctx.fillStyle = '#747d8c';
                        ctx.fillRect(x, y, TILE_SIZE, 3);
                    }
                } else if (theme === 'magma') {
                    // Dark obsidian volcanic rock with glowing veins
                    ctx.fillStyle = '#1e272e';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#eb4d4b';
                    ctx.fillRect(x + 8, y + 10, 8, 2);
                    ctx.fillRect(x + 18, y + 18, 6, 2);
                    if (isTop) {
                        ctx.fillStyle = '#ff793f';
                        ctx.fillRect(x, y, TILE_SIZE, 3);
                    }
                } else if (theme === 'crystal') {
                    // Crystalline cosmic brick
                    ctx.fillStyle = '#2c2c54';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#40407a';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    if (isTop) {
                        ctx.fillStyle = '#706fd3';
                        ctx.fillRect(x, y, TILE_SIZE, 4);
                        ctx.fillStyle = '#00d2d3';
                        ctx.fillRect(x + 6, y + 2, 4, 2);
                    }
                }
                break;
            }

            case TILE_TYPES.ONE_WAY: {
                // Wooden / Steel bridge girder platform
                ctx.fillStyle = '#d35400';
                ctx.fillRect(x, y, TILE_SIZE, 8);
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(x, y, TILE_SIZE, 3);
                // Rivets
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(x + 4, y + 4, 3, 2);
                ctx.fillRect(x + TILE_SIZE - 7, y + 4, 3, 2);
                break;
            }

            case TILE_TYPES.SPIKE: {
                // Hazard spikes on floor
                ctx.fillStyle = '#dfe4ea';
                ctx.beginPath();
                // 3 Sharp Spike cones
                ctx.moveTo(x + 2, y + TILE_SIZE);
                ctx.lineTo(x + 6, y + 10);
                ctx.lineTo(x + 10, y + TILE_SIZE);

                ctx.moveTo(x + 11, y + TILE_SIZE);
                ctx.lineTo(x + 16, y + 6);
                ctx.lineTo(x + 21, y + TILE_SIZE);

                ctx.moveTo(x + 22, y + TILE_SIZE);
                ctx.lineTo(x + 26, y + 10);
                ctx.lineTo(x + 30, y + TILE_SIZE);
                ctx.fill();

                // Blood / Rust accents
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(x + 5, y + 10, 2, 4);
                ctx.fillRect(x + 15, y + 6, 2, 5);
                ctx.fillRect(x + 25, y + 10, 2, 4);
                break;
            }

            case TILE_TYPES.LAVA: {
                // Animated Molten Lava / Acid wave
                const wave1 = Math.sin(animTimer * 5 + c) * 3;
                const wave2 = Math.cos(animTimer * 4 + c * 0.8) * 2;
                ctx.fillStyle = '#eb4d4b';
                ctx.fillRect(x, y + 4 + wave1, TILE_SIZE, TILE_SIZE - 4 - wave1);

                // Bright yellow hot crust
                ctx.fillStyle = '#f9ca24';
                ctx.fillRect(x, y + 2 + wave1, TILE_SIZE, 4);

                // Bubbles
                if (Math.floor(animTimer * 3 + c) % 4 === 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(x + 16, y + 8 + wave2, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            case TILE_TYPES.LOCKED_DOOR: {
                if (level.isDoorUnlocked(c, r)) return;
                // Security Lock Barrier
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#d35400';
                ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

                // Keyhole icon
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(x + 16, y + 13, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(x + 14, y + 14, 4, 8);
                break;
            }

            case TILE_TYPES.EXIT_PORTAL: {
                // Grand Exit Portal Arch & Swirling Vortex
                const glow = Math.sin(animTimer * 6) * 0.2 + 0.8;

                // Swirling vortex background
                ctx.save();
                ctx.translate(x + 16, y + 16);
                ctx.rotate(animTimer * 2);
                const portalGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
                portalGrad.addColorStop(0, '#ffffff');
                portalGrad.addColorStop(0.5, '#00d2d3');
                portalGrad.addColorStop(1, 'rgba(84, 160, 255, 0)');
                ctx.fillStyle = portalGrad;
                ctx.fillRect(-16, -16, 32, 32);
                ctx.restore();

                // Stone Portal Frame
                ctx.fillStyle = '#2f3542';
                ctx.fillRect(x + 2, y + 2, 5, 28);
                ctx.fillRect(x + 25, y + 2, 5, 28);
                ctx.fillRect(x + 2, y + 2, 28, 5);

                // Runes on arch
                ctx.fillStyle = `rgba(0, 210, 211, ${glow})`;
                ctx.fillRect(x + 3, y + 8, 3, 3);
                ctx.fillRect(x + 26, y + 8, 3, 3);
                ctx.fillRect(x + 14, y + 3, 4, 3);
                break;
            }
        }
    }

    static drawMovingPlatforms(ctx, platforms, animTimer) {
        for (const p of platforms) {
            ctx.save();
            // Platform Body
            ctx.fillStyle = '#2f3542';
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.width, p.height);

            // Platform top rim
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.width, 3);

            // Mechanical gears in center
            ctx.fillStyle = '#57606f';
            ctx.fillRect(Math.round(p.x + p.width / 2 - 8), Math.round(p.y + 3), 16, p.height - 5);

            ctx.restore();
        }
    }
}

