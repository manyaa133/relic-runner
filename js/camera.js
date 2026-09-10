// js/camera.js - Smooth Lerp Follow Camera with Lookahead & Screen Shake

export class Camera {
    constructor(viewWidth, viewHeight) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lerpSpeed = 0.09;

        // Screen Shake
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    reset(x, y, levelWidth, levelHeight) {
        this.targetX = x - this.viewWidth / 2;
        this.targetY = y - this.viewHeight / 2;
        this.clamp(levelWidth, levelHeight);
        this.x = this.targetX;
        this.y = this.targetY;
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    triggerShake(magnitude = 6, duration = 0.25) {
        this.shakeMagnitude = magnitude;
        this.shakeTime = duration;
    }

    update(dt, targetEntity, levelWidth, levelHeight) {
        // Calculate target camera center with subtle lookahead based on player facing and velocity
        const lookaheadX = targetEntity.vx * 0.2;
        const lookaheadY = targetEntity.vy * 0.1;

        const desiredCenterX = targetEntity.x + targetEntity.width / 2 + lookaheadX;
        const desiredCenterY = targetEntity.y + targetEntity.height / 2 + lookaheadY;

        this.targetX = desiredCenterX - this.viewWidth / 2;
        this.targetY = desiredCenterY - this.viewHeight / 2;

        this.clamp(levelWidth, levelHeight);

        // Smooth interpolation
        this.x += (this.targetX - this.x) * (1 - Math.pow(1 - this.lerpSpeed, dt * 60));
        this.y += (this.targetY - this.y) * (1 - Math.pow(1 - this.lerpSpeed, dt * 60));

        // Screen Shake calculation
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            const progress = this.shakeTime / 0.25;
            const currentMag = this.shakeMagnitude * progress;
            this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentMag;
            this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentMag;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    clamp(levelWidth, levelHeight) {
        const maxX = Math.max(0, levelWidth - this.viewWidth);
        const maxY = Math.max(0, levelHeight - this.viewHeight);

        if (this.targetX < 0) this.targetX = 0;
        if (this.targetX > maxX) this.targetX = maxX;
        if (this.targetY < 0) this.targetY = 0;
        if (this.targetY > maxY) this.targetY = maxY;
    }

    getRenderOffset() {
        return {
            x: Math.round(this.x + this.shakeOffsetX),
            y: Math.round(this.y + this.shakeOffsetY)
        };
    }
}

