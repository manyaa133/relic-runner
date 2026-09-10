// js/physics.js - Robust 2D AABB Tilemap & Entity Physics Engine

export const TILE_SIZE = 32;

export const TILE_TYPES = {
    EMPTY: 0,
    SOLID: 1,
    ONE_WAY: 2,
    SPIKE: 3,
    LAVA: 4,
    LOCKED_DOOR: 5,
    EXIT_PORTAL: 6,
    CHECKPOINT: 7,
    BREAKABLE: 8
};

export class Physics {
    static checkAABB(box1, box2) {
        return (
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y
        );
    }

    static pointInBox(px, py, box) {
        return (
            px >= box.x &&
            px <= box.x + box.width &&
            py >= box.y &&
            py <= box.y + box.height
        );
    }

    // Resolves tile collisions for an entity with {x, y, vx, vy, width, height, onGround, ...}
    static updateEntityTileCollisions(entity, level, dt, movingPlatforms = []) {
        const halfW = entity.width;
        const halfH = entity.height;

        // 1. HORIZONTAL MOVEMENT & COLLISION
        entity.x += entity.vx * dt;
        let leftTile = Math.floor(entity.x / TILE_SIZE);
        let rightTile = Math.floor((entity.x + entity.width - 0.01) / TILE_SIZE);
        let topTile = Math.floor(entity.y / TILE_SIZE);
        let bottomTile = Math.floor((entity.y + entity.height - 0.01) / TILE_SIZE);

        for (let r = topTile; r <= bottomTile; r++) {
            for (let c = leftTile; c <= rightTile; c++) {
                const tile = level.getTile(c, r);
                if (tile === TILE_TYPES.SOLID || (tile === TILE_TYPES.LOCKED_DOOR && !level.isDoorUnlocked(c, r))) {
                    if (entity.vx > 0) {
                        entity.x = c * TILE_SIZE - entity.width;
                        entity.vx = 0;
                    } else if (entity.vx < 0) {
                        entity.x = (c + 1) * TILE_SIZE;
                        entity.vx = 0;
                    }
                }
            }
        }

        // 2. VERTICAL MOVEMENT & COLLISION
        const prevY = entity.y;
        entity.y += entity.vy * dt;
        entity.onGround = false;

        leftTile = Math.floor(entity.x / TILE_SIZE);
        rightTile = Math.floor((entity.x + entity.width - 0.01) / TILE_SIZE);
        topTile = Math.floor(entity.y / TILE_SIZE);
        bottomTile = Math.floor((entity.y + entity.height - 0.01) / TILE_SIZE);

        for (let r = topTile; r <= bottomTile; r++) {
            for (let c = leftTile; c <= rightTile; c++) {
                const tile = level.getTile(c, r);
                const isSolid = (tile === TILE_TYPES.SOLID || (tile === TILE_TYPES.LOCKED_DOOR && !level.isDoorUnlocked(c, r)));

                if (isSolid) {
                    if (entity.vy > 0) {
                        entity.y = r * TILE_SIZE - entity.height;
                        entity.vy = 0;
                        entity.onGround = true;
                    } else if (entity.vy < 0) {
                        // Soft corner nudging: if hitting ceiling on edge, nudge player into open slot
                        const hitLeftEdge = (entity.x + entity.width) - (c * TILE_SIZE) < 6;
                        const hitRightEdge = ((c + 1) * TILE_SIZE) - entity.x < 6;

                        if (hitLeftEdge && level.getTile(c - 1, r) === TILE_TYPES.EMPTY) {
                            entity.x -= 4;
                        } else if (hitRightEdge && level.getTile(c + 1, r) === TILE_TYPES.EMPTY) {
                            entity.x += 4;
                        } else {
                            entity.y = (r + 1) * TILE_SIZE;
                            entity.vy = 0;
                        }
                    }
                } else if (tile === TILE_TYPES.ONE_WAY) {
                    // Check if player landed on top of one-way platform
                    const tileTop = r * TILE_SIZE;
                    const prevBottom = prevY + entity.height;
                    const curBottom = entity.y + entity.height;

                    if (entity.vy >= 0 && prevBottom <= tileTop + 6 && curBottom >= tileTop) {
                        entity.y = tileTop - entity.height;
                        entity.vy = 0;
                        entity.onGround = true;
                    }
                }
            }
        }

        // 3. MOVING PLATFORMS COLLISION
        for (const plat of movingPlatforms) {
            const platBox = { x: plat.x, y: plat.y, width: plat.width, height: plat.height };
            const prevBottom = prevY + entity.height;
            const curBottom = entity.y + entity.height;

            // Check if entity feet are landing on top of platform
            if (
                entity.vy >= 0 &&
                prevBottom <= plat.y + 8 &&
                curBottom >= plat.y &&
                entity.x + entity.width > plat.x + 2 &&
                entity.x < plat.x + plat.width - 2
            ) {
                entity.y = plat.y - entity.height;
                entity.vy = 0;
                entity.onGround = true;
                // Inherit platform velocity
                entity.x += plat.vx * dt;
                entity.y += plat.vy * dt;
            }
        }
    }

    // Checks if a bounding box intersects tile-based hazards (spikes, lava)
    static checkTileHazards(box, level) {
        const leftTile = Math.floor(box.x / TILE_SIZE);
        const rightTile = Math.floor((box.x + box.width - 0.01) / TILE_SIZE);
        const topTile = Math.floor(box.y / TILE_SIZE);
        const bottomTile = Math.floor((box.y + box.height - 0.01) / TILE_SIZE);

        for (let r = topTile; r <= bottomTile; r++) {
            for (let c = leftTile; c <= rightTile; c++) {
                const tile = level.getTile(c, r);

                if (tile === TILE_TYPES.SPIKE) {
                    // Thorns/Spikes hazard box (floor cones)
                    const spikeBox = {
                        x: c * TILE_SIZE + 2,
                        y: r * TILE_SIZE + 8,
                        width: TILE_SIZE - 4,
                        height: TILE_SIZE - 8
                    };
                    if (Physics.checkAABB(box, spikeBox)) {
                        return { type: 'spike', tileC: c, tileR: r, box: spikeBox };
                    }
                } else if (tile === TILE_TYPES.LAVA) {
                    // Lava hazard box: starts 4px below tile top (liquid wave surface)
                    // Ensuring player safely standing on top of platform at r-1 with feet at r*TILE_SIZE does not trigger lava
                    const lavaBox = {
                        x: c * TILE_SIZE,
                        y: r * TILE_SIZE + 4,
                        width: TILE_SIZE,
                        height: TILE_SIZE - 4
                    };
                    if (Physics.checkAABB(box, lavaBox)) {
                        return { type: 'lava', tileC: c, tileR: r, box: lavaBox };
                    }
                }
            }
        }
        return null;
    }

    // Precise doorway opening trigger inside the 32x32 exit portal arch
    static getExitDoorwayBox(exitCoord) {
        return {
            x: exitCoord.x + 6,
            y: exitCoord.y + 4,
            width: 20,
            height: 28
        };
    }
}

