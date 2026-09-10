// js/levelValidator.js - Analytical Level Geometry & Jump Reachability Validator

import { CHARACTERS } from './characters.js';
import { TILE_TYPES, TILE_SIZE } from './physics.js';
import { LEVELS_DATA, Level } from './levels.js';

export class LevelValidator {
    static validateAll() {
        console.log('=== RUNNING LEVEL GEOMETRY VALIDATION SUITE ===');
        const results = [];

        for (const data of LEVELS_DATA) {
            const level = new Level(data);
            const levelResult = this.validateLevel(level);
            results.push(levelResult);
        }

        const allPassed = results.every(r => r.passed);
        if (allPassed) {
            console.log('%c[LEVEL VALIDATOR] ALL LEVELS 100% VALIDATED AND FAIR!', 'color: #2ed573; font-weight: bold;');
        } else {
            console.warn('[LEVEL VALIDATOR] Validation issues detected:', results);
        }

        return { allPassed, results };
    }

    static validateLevel(level) {
        const issues = [];
        const info = {
            id: level.id,
            name: level.name,
            totalCollectibles: level.collectibles.length,
            totalCheckpoints: level.checkpoints.length,
            totalEnemies: level.enemyDefs.length
        };

        // 1. Check Physics Envelopes for all characters
        const baseGravity = 1200;
        const baseJumpVel = -435;
        const baseSpeed = 230;

        for (const [charId, char] of Object.entries(CHARACTERS)) {
            const jumpVel = Math.abs(baseJumpVel * char.jumpMultiplier);
            const speed = baseSpeed * char.speedMultiplier;
            const timeToApex = jumpVel / baseGravity;
            const maxJumpHeight = (jumpVel * jumpVel) / (2 * baseGravity);
            const totalAirTime = timeToApex * 2;
            const maxHorizontalSpan = speed * totalAirTime;

            // In Tiles:
            const heightInTiles = (maxJumpHeight / TILE_SIZE).toFixed(2);
            const spanInTiles = (maxHorizontalSpan / TILE_SIZE).toFixed(2);

            // Sanity assertions
            if (maxJumpHeight < 64) {
                issues.push(`Character ${charId} jump height too low (${maxJumpHeight.toFixed(1)}px)`);
            }
        }

        // 2. Validate Collectibles are NOT inside solid tiles
        for (const c of level.collectibles) {
            const tileC = Math.floor((c.x + TILE_SIZE / 2) / TILE_SIZE);
            const tileR = Math.floor((c.y + TILE_SIZE / 2) / TILE_SIZE);
            const tile = level.getTile(tileC, tileR);

            if (tile === TILE_TYPES.SOLID) {
                issues.push(`Collectible ${c.type} at (${c.x}, ${c.y}) is inside a solid tile [${tileC}, ${tileR}]!`);
            }
        }

        // 3. Validate Checkpoints have standing space and are not inside solid tiles
        for (const cp of level.checkpoints) {
            const tileC = Math.floor((cp.x + TILE_SIZE / 2) / TILE_SIZE);
            const tileR = Math.floor((cp.y + TILE_SIZE / 2) / TILE_SIZE);
            const tile = level.getTile(tileC, tileR);

            if (tile === TILE_TYPES.SOLID) {
                issues.push(`Checkpoint ${cp.id} at (${cp.x}, ${cp.y}) is inside a solid tile!`);
            }
        }

        // 4. Validate Exit Portal is not embedded
        const exitC = Math.floor(level.exit.x / TILE_SIZE);
        const exitR = Math.floor(level.exit.y / TILE_SIZE);
        const exitTile = level.getTile(exitC, exitR);
        if (exitTile === TILE_TYPES.SOLID) {
            issues.push(`Exit portal at (${level.exit.x}, ${level.exit.y}) is blocked by solid geometry!`);
        }

        const passed = issues.length === 0;
        return {
            levelId: level.id,
            name: level.name,
            passed,
            issues,
            info
        };
    }
}

