// js/main.js - Application Entry Point, Dual WASD & Arrow Key Input Handlers & Animation Frame Loop

import { Game } from './game.js';
import { audioManager } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    // ==========================================
    // DUAL KEYBOARD INPUT HANDLING (WASD + Arrow Keys + Space + ESC/P)
    // ==========================================
    // Set of currently held physical keys
    const heldKeys = new Set();

    // Prevent default browser scrolling only for gaming keys when not typing in text fields
    const gameplayKeys = new Set([
        'KeyA', 'KeyD', 'KeyW', 'KeyS',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Space', 'KeyK', 'KeyZ'
    ]);

    function isTextInputActive() {
        const active = document.activeElement;
        if (!active) return false;
        const tag = active.tagName.toLowerCase();
        return (tag === 'input' && active.type === 'text') || tag === 'textarea';
    }

    function updateGameInput(triggerJumpEvent = false) {
        // Evaluate directional states based on held keys
        game.input.left = heldKeys.has('KeyA') || heldKeys.has('ArrowLeft');
        game.input.right = heldKeys.has('KeyD') || heldKeys.has('ArrowRight');
        game.input.up = heldKeys.has('KeyW') || heldKeys.has('ArrowUp');
        game.input.down = heldKeys.has('KeyS') || heldKeys.has('ArrowDown');

        const isJumpHeld = (
            heldKeys.has('KeyW') || 
            heldKeys.has('ArrowUp') || 
            heldKeys.has('Space') || 
            heldKeys.has('KeyK') || 
            heldKeys.has('KeyZ')
        );

        if (triggerJumpEvent) {
            game.input.jumpJustPressed = true;
        }
        game.input.jumpPressed = isJumpHeld;
    }

    window.addEventListener('keydown', (e) => {
        // Initialize AudioContext on first user gesture
        audioManager.init();
        audioManager.resume();

        // Pause Toggle
        if (e.code === 'Escape' || e.code === 'KeyP') {
            if (!isTextInputActive()) {
                e.preventDefault();
                game.togglePause();
                return;
            }
        }

        // Toggle Collision Debugging (F3 or B)
        if (e.code === 'F3' || e.code === 'KeyB') {
            if (!isTextInputActive()) {
                e.preventDefault();
                game.debugCollisions = !game.debugCollisions;
                console.log(`[DEBUG] Collision boundaries overlay: ${game.debugCollisions ? 'ENABLED' : 'DISABLED'}`);
                return;
            }
        }

        if (gameplayKeys.has(e.code)) {
            if (!isTextInputActive()) {
                e.preventDefault(); // Stop page scrolling
            }

            const isJumpKey = (
                e.code === 'KeyW' || 
                e.code === 'ArrowUp' || 
                e.code === 'Space' || 
                e.code === 'KeyK' || 
                e.code === 'KeyZ'
            );
            const isFirstPress = !heldKeys.has(e.code);

            heldKeys.add(e.code);
            updateGameInput(isJumpKey && isFirstPress);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (gameplayKeys.has(e.code)) {
            if (!isTextInputActive()) {
                e.preventDefault();
            }
            heldKeys.delete(e.code);
            updateGameInput(false);
        }
    });

    // Clear stuck keys if window loses focus (e.g. Alt+Tab)
    window.addEventListener('blur', () => {
        heldKeys.clear();
        updateGameInput(false);
    });

    // Audio resume on any pointer interaction
    window.addEventListener('pointerdown', () => {
        audioManager.init();
        audioManager.resume();
    });

    // ==========================================
    // FIXED DELTA TIME GAME LOOP
    // ==========================================
    let lastTime = performance.now();
    const maxDt = 0.05; // 50ms clamp to avoid spiral of death on tab unfocus

    function gameLoop(currentTime) {
        let dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (dt > maxDt) dt = maxDt;

        game.update(dt);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    game.init();
    requestAnimationFrame(gameLoop);
});
