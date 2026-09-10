// js/characters.js - Character Roster definitions, statistics, and procedural pixel-art renderers

export const CHARACTERS = {
    explorer: {
        id: 'explorer',
        name: 'Alex the Explorer',
        title: 'Balanced Adventurer',
        description: 'Reliable all-around explorer with well-honed reflexes and balanced jump agility.',
        speedMultiplier: 1.0,
        jumpMultiplier: 1.0,
        startingLives: 3,
        invulnerabilityDuration: 2.0,
        colors: {
            primary: '#e67e22',   // Ochre coat
            secondary: '#d35400', // Trim
            accent: '#f1c40f',    // Buckle / scarf
            hat: '#8e44ad',       // Explorer Fedora
            skin: '#f5cd79',
            hair: '#4b4b4b',
            pants: '#34495e',
            boots: '#2c3e50',
            particles: '#f39c12'
        },
        stats: {
            speed: 3,
            jump: 3,
            lives: 3,
            defense: 3
        }
    },
    runner: {
        id: 'runner',
        name: 'Dash Swiftfoot',
        title: 'Agile Speedster',
        description: 'Blazing fast sprint speed allows clearing long horizontal gaps with ease, but has a slightly lower vertical jump.',
        speedMultiplier: 1.22,
        jumpMultiplier: 0.92,
        startingLives: 3,
        invulnerabilityDuration: 2.0,
        colors: {
            primary: '#e74c3c',   // Crimson suit
            secondary: '#c0392b',
            accent: '#f1c40f',    // Lightning yellow
            hat: '#2c3e50',       // Visor / Goggles
            skin: '#f8c291',
            hair: '#e67e22',
            pants: '#1e272e',
            boots: '#e74c3c',
            particles: '#ff4757'
        },
        stats: {
            speed: 5,
            jump: 2,
            lives: 3,
            defense: 2
        }
    },
    jumper: {
        id: 'jumper',
        name: 'Zara Skybound',
        title: 'Acrobatic Leaper',
        description: 'Exceptional vertical leap reaches high ledges and platforms effortlessly, with a slightly measured running pace.',
        speedMultiplier: 0.90,
        jumpMultiplier: 1.15,
        startingLives: 3,
        invulnerabilityDuration: 2.0,
        colors: {
            primary: '#2ecc71',   // Emerald tunic
            secondary: '#27ae60',
            accent: '#1abc9c',    // Cyan sash
            hat: '#16a085',       // Feathered headband
            skin: '#ffeaa7',
            hair: '#6c5ce7',
            pants: '#2d3436',
            boots: '#00b894',
            particles: '#2ed573'
        },
        stats: {
            speed: 2,
            jump: 5,
            lives: 3,
            defense: 3
        }
    },
    adventurer: {
        id: 'adventurer',
        name: 'Captain Ron',
        title: 'Veteran Survivor',
        description: 'Seasoned treasure hunter starting with 4 lives and extended recovery protection after taking damage.',
        speedMultiplier: 0.96,
        jumpMultiplier: 0.98,
        startingLives: 4,
        invulnerabilityDuration: 2.6,
        colors: {
            primary: '#3498db',   // Navy explorer jacket
            secondary: '#2980b9',
            accent: '#e67e22',    // Brass shoulder pad
            hat: '#1e3799',       // Captain cap
            skin: '#fed330',
            hair: '#778ca3',      // Rugged grey beard
            pants: '#4b6584',
            boots: '#2f3542',
            particles: '#70a1ff'
        },
        stats: {
            speed: 3,
            jump: 3,
            lives: 5,
            defense: 4
        }
    }
};

export class CharacterRenderer {
    static draw(ctx, charId, x, y, width, height, state = 'idle', facing = 1, animTimer = 0, invulnerable = false) {
        const char = CHARACTERS[charId] || CHARACTERS.explorer;
        const c = char.colors;

        if (invulnerable && Math.floor(animTimer * 20) % 2 === 0) {
            // Flash during invulnerability
            ctx.globalAlpha = 0.4;
        }

        ctx.save();
        ctx.translate(Math.round(x + width / 2), Math.round(y + height));
        ctx.scale(facing, 1);

        // Subpixel snapping
        const px = -width / 2;
        const py = -height;

        let bob = 0;
        let legOffset1 = 0;
        let legOffset2 = 0;
        let armAngle = 0;

        if (state === 'run') {
            bob = Math.sin(animTimer * 16) * 1.5;
            legOffset1 = Math.sin(animTimer * 16) * 4;
            legOffset2 = -Math.sin(animTimer * 16) * 4;
            armAngle = Math.sin(animTimer * 16) * 0.4;
        } else if (state === 'idle') {
            bob = Math.sin(animTimer * 3) * 0.8;
        } else if (state === 'jump') {
            bob = -2;
            legOffset1 = -2;
            legOffset2 = 1;
            armAngle = -0.6;
        } else if (state === 'fall') {
            bob = 1;
            legOffset1 = 2;
            legOffset2 = -1;
            armAngle = 0.5;
        } else if (state === 'hurt') {
            bob = -1;
            armAngle = 0.8;
        }

        // 1. Shadow beneath character
        if (state !== 'jump' && state !== 'fall') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(0, -1, width * 0.45, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Legs / Boots
        const legW = 5;
        const legH = 8;
        const legY = py + height - 8 + bob;

        // Back leg
        ctx.fillStyle = c.pants;
        ctx.fillRect(-6 + legOffset2 * 0.5, legY, legW, legH - 2);
        ctx.fillStyle = c.boots;
        ctx.fillRect(-7 + legOffset2 * 0.5, legY + legH - 3, legW + 2, 3);

        // Front leg
        ctx.fillStyle = c.pants;
        ctx.fillRect(1 + legOffset1 * 0.5, legY, legW, legH - 2);
        ctx.fillStyle = c.boots;
        ctx.fillRect(0 + legOffset1 * 0.5, legY + legH - 3, legW + 2, 3);

        // 3. Torso / Jacket
        const bodyW = 14;
        const bodyH = 12;
        const bodyY = py + height - 20 + bob;
        ctx.fillStyle = c.primary;
        ctx.fillRect(-7, bodyY, bodyW, bodyH);

        // Jacket trim & belt
        ctx.fillStyle = c.secondary;
        ctx.fillRect(-2, bodyY, 4, bodyH - 2);
        ctx.fillStyle = c.accent;
        ctx.fillRect(-6, bodyY + bodyH - 3, bodyW - 2, 3); // Belt
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-2, bodyY + bodyH - 3, 4, 3); // Buckle

        // 4. Arms / Hands
        ctx.save();
        ctx.translate(-4, bodyY + 3);
        ctx.rotate(armAngle);
        ctx.fillStyle = c.secondary;
        ctx.fillRect(-2, 0, 4, 8);
        ctx.fillStyle = c.skin;
        ctx.fillRect(-2, 7, 4, 3); // Hand
        ctx.restore();

        // 5. Head & Face
        const headW = 12;
        const headH = 10;
        const headY = bodyY - headH + 1;
        ctx.fillStyle = c.skin;
        ctx.fillRect(-6, headY, headW, headH);

        // Hair / Beard (for Captain Ron)
        if (char.id === 'adventurer') {
            ctx.fillStyle = c.hair;
            ctx.fillRect(-5, headY + 5, headW - 2, 5); // Beard
        }

        // Eyes (facing forward)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, headY + 3, 3, 3);
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(2, headY + 4, 2, 2);

        // 6. Hat / Headgear
        if (char.id === 'explorer') {
            // Fedora style
            ctx.fillStyle = c.hat;
            ctx.fillRect(-8, headY - 2, 16, 3); // Brim
            ctx.fillRect(-5, headY - 7, 10, 6); // Crown
            ctx.fillStyle = c.accent;
            ctx.fillRect(-5, headY - 3, 10, 2); // Hatband
        } else if (char.id === 'runner') {
            // Speed Visor / Headband
            ctx.fillStyle = c.hat;
            ctx.fillRect(-7, headY - 1, 14, 4);
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(0, headY, 5, 2); // Neon Visor glass
        } else if (char.id === 'jumper') {
            // Acrobat Band + Feather
            ctx.fillStyle = c.hat;
            ctx.fillRect(-7, headY - 1, 14, 3);
            ctx.fillStyle = '#feca57';
            ctx.fillRect(-5, headY - 6, 2, 6); // Feather
        } else if (char.id === 'adventurer') {
            // Captain cap
            ctx.fillStyle = c.hat;
            ctx.fillRect(-7, headY - 5, 14, 5);
            ctx.fillStyle = '#2f3542';
            ctx.fillRect(-1, headY - 1, 8, 2); // Cap visor
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-6, headY - 2, 12, 2); // Gold trim
        }

        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
}

