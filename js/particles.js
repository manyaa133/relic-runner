// js/particles.js - Dynamic particle effects system

class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'square', gravity = 300, fade = true) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.shape = shape; // 'square', 'circle', 'spark', 'ring'
        this.gravity = gravity;
        this.fade = fade;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 8;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.rotation += this.vRot * dt;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const progress = Math.max(0, this.life / this.maxLife);
        const alpha = this.fade ? progress : 1;
        const curSize = this.shape === 'ring' ? this.size * (2 - progress) : this.size * (0.3 + 0.7 * progress);

        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha;

        if (this.shape === 'square') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-curSize / 2, -curSize / 2, curSize, curSize);
        } else if (this.shape === 'circle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, curSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'spark') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-curSize, 0);
            ctx.lineTo(curSize, 0);
            ctx.moveTo(0, -curSize);
            ctx.lineTo(0, curSize);
            ctx.stroke();
        } else if (this.shape === 'ring') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2 * progress;
            ctx.beginPath();
            ctx.arc(0, 0, curSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(ctx);
        }
    }

    clear() {
        this.particles = [];
    }

    // Preset effects
    spawnDust(x, y, count = 4, color = '#d0d0c0') {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 50;
            const vy = -Math.random() * 40 - 10;
            const size = Math.random() * 3 + 2;
            const life = Math.random() * 0.25 + 0.15;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'circle', 100));
        }
    }

    spawnJumpPuff(x, y, color = '#ffffff') {
        for (let i = 0; i < 6; i++) {
            const vx = (Math.random() - 0.5) * 80;
            const vy = -Math.random() * 20;
            const size = Math.random() * 3 + 2;
            const life = Math.random() * 0.3 + 0.1;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'circle', 50));
        }
    }

    spawnCollectSparkles(x, y, color = '#ffdf00', count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 120 + 30;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 0.4 + 0.25;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'spark', 150));
        }
    }

    spawnExtraLifeBurst(x, y) {
        // Red and golden heart sparkle explosion + expanding ring
        this.particles.push(new Particle(x, y, 0, 0, '#ff4757', 16, 0.5, 'ring', 0));
        this.particles.push(new Particle(x, y, 0, 0, '#ffd32a', 24, 0.6, 'ring', 0));
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 160 + 40;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = i % 2 === 0 ? '#ff4757' : '#ffd32a';
            const size = Math.random() * 5 + 3;
            const life = Math.random() * 0.6 + 0.3;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'circle', 100));
        }
    }

    spawnCheckpointActivation(x, y) {
        // Glowing cyan/gold pulse rings and rising particles
        this.particles.push(new Particle(x, y, 0, 0, '#00d2d3', 20, 0.6, 'ring', 0));
        this.particles.push(new Particle(x, y, 0, 0, '#54a0ff', 30, 0.8, 'ring', 0));
        for (let i = 0; i < 25; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 120 + 40;
            const vx = Math.sin(angle) * speed * 0.8;
            const vy = -Math.abs(Math.cos(angle) * speed) - 50;
            const color = i % 3 === 0 ? '#1dd1a1' : (i % 3 === 1 ? '#00d2d3' : '#ffffff');
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 0.7 + 0.3;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'spark', -50));
        }
    }

    spawnDeathExplosion(x, y, mainColor = '#ff6b6b') {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 180 + 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 60;
            const colors = [mainColor, '#feca57', '#ff9f43', '#ffffff'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 5 + 3;
            const life = Math.random() * 0.6 + 0.3;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'square', 400));
        }
    }

    spawnEnemyDefeat(x, y, color = '#ff9ff3') {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 130 + 30;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 40;
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 0.4 + 0.2;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'circle', 350));
        }
    }

    spawnAmbientEmber(x, y, color = '#ff9f43') {
        if (Math.random() > 0.4) return;
        const vx = (Math.random() - 0.5) * 20;
        const vy = -Math.random() * 30 - 15;
        const size = Math.random() * 3 + 1;
        const life = Math.random() * 0.8 + 0.4;
        this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'circle', -20));
    }
}

