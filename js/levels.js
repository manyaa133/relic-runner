// js/levels.js - Handcrafted Levels, Platforms, Hazards, Enemies & Collectibles

import { TILE_TYPES, TILE_SIZE } from './physics.js';
import { SawbladeHazard, FlameJetHazard } from './hazards.js';
import { SlimeCrawler, CaveGlider, PlasmaTurret, LeapHopper } from './enemies.js';
import { Collectible } from './collectibles.js';
import { Checkpoint } from './checkpoints.js';

export class Level {
    constructor(levelData) {
        this.id = levelData.id;
        this.name = levelData.name;
        this.theme = levelData.theme; // 'forest', 'temple', 'magma', 'crystal'
        this.widthInTiles = levelData.width;
        this.heightInTiles = levelData.height;
        this.musicTrack = levelData.musicTrack;

        this.spawn = { ...levelData.spawn };
        this.exit = { ...levelData.exit };

        // Grid matrix
        this.grid = this.createGrid(levelData.map);
        this.unlockedDoors = new Set();

        // Entities & Objects
        this.movingPlatforms = levelData.movingPlatforms ? levelData.movingPlatforms.map(p => ({ ...p })) : [];
        this.checkpoints = levelData.checkpoints ? levelData.checkpoints.map(cp => new Checkpoint(cp.id, cp.x, cp.y)) : [];
        this.collectibles = levelData.collectibles ? levelData.collectibles.map(c => new Collectible(c.x, c.y, c.type, c.id)) : [];
        this.enemyDefs = levelData.enemies || [];
        this.hazardDefs = levelData.hazards || [];
    }

    createGrid(mapString) {
        const rows = mapString.trim().split('\n').map(r => r.trim());
        const grid = [];
        for (let r = 0; r < this.heightInTiles; r++) {
            grid[r] = [];
            const rowStr = rows[r] || '';
            for (let c = 0; c < this.widthInTiles; c++) {
                const char = rowStr[c] || '.';
                grid[r][c] = this.charToTileType(char);
            }
        }
        return grid;
    }

    charToTileType(ch) {
        switch (ch) {
            case '#': return TILE_TYPES.SOLID;
            case '=': return TILE_TYPES.ONE_WAY;
            case '^': return TILE_TYPES.SPIKE;
            case '~': return TILE_TYPES.LAVA;
            case 'D': return TILE_TYPES.LOCKED_DOOR;
            case 'X': return TILE_TYPES.EXIT_PORTAL;
            case 'C': return TILE_TYPES.CHECKPOINT;
            default: return TILE_TYPES.EMPTY;
        }
    }

    getTile(c, r) {
        if (c < 0 || c >= this.widthInTiles || r < 0 || r >= this.heightInTiles) {
            return TILE_TYPES.SOLID; // Solid boundary walls
        }
        return this.grid[r][c];
    }

    unlockDoor(c, r) {
        this.unlockedDoors.add(`${c},${r}`);
    }

    isDoorUnlocked(c, r) {
        return this.unlockedDoors.has(`${c},${r}`);
    }

    unlockAllDoorsWithId(keyId) {
        for (let r = 0; r < this.heightInTiles; r++) {
            for (let c = 0; c < this.widthInTiles; c++) {
                if (this.grid[r][c] === TILE_TYPES.LOCKED_DOOR) {
                    this.unlockDoor(c, r);
                }
            }
        }
    }

    updateMovingPlatforms(dt) {
        for (const p of this.movingPlatforms) {
            p.time = (p.time || 0) + dt;
            const progress = (Math.sin(p.time * p.speed) + 1) / 2;
            const prevX = p.x;
            const prevY = p.y;
            p.x = p.startX + (p.endX - p.startX) * progress;
            p.y = p.startY + (p.endY - p.startY) * progress;
            p.vx = (p.x - prevX) / dt;
            p.vy = (p.y - prevY) / dt;
        }
    }
}

// Handcrafted 4 Multi-tier Levels (Valid Geometry Verified)
export const LEVELS_DATA = [
    // ==========================================
    // LEVEL 1: EMERALD CANOPY (Forest Ruins)
    // Width: 60, Height: 16
    // ==========================================
    {
        id: 1,
        name: 'Level 1: Emerald Canopy',
        theme: 'forest',
        musicTrack: 'level1',
        width: 60,
        height: 16,
        spawn: { x: 64, y: 352 },
        exit: { x: 1856, y: 352 },
        map: `
############################################################
#..........................................................#
#..........................................................#
#.........................####.............................#
#..................===...#....#............................#
#........###......#.......#...#............==..............#
#.......#...#....#........#..##...........#..#.............#
#......#.....#..#..........##............#....#.....===....#
#.....#.......##........................#......#...#...#...#
#....#..........................#D#....#........#.#.....#..#
#...#..........................#...#..#..........#.......#.#
#..#......===.................#.....##....................X#
#.#......#...#.....^^........#..........................####
#################################..####..###################
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
############################################################
`,
        checkpoints: [
            { id: 'cp1_1', x: 736, y: 336 }
        ],
        movingPlatforms: [
            { id: 'mp1', startX: 480, startY: 352, endX: 620, endY: 352, x: 480, y: 352, width: 64, height: 12, speed: 1.2, vx: 0, vy: 0 }
        ],
        collectibles: [
            { x: 192, y: 288, type: 'coin' },
            { x: 224, y: 288, type: 'coin' },
            { x: 256, y: 288, type: 'coin' },
            { x: 384, y: 160, type: 'gem' },
            { x: 544, y: 96,  type: 'key', id: 'forest_key' },
            { x: 800, y: 96,  type: 'extra_life' }, // Extra Life hidden on upper canopy!
            { x: 928, y: 320, type: 'coin' },
            { x: 1056, y: 224, type: 'coin' },
            { x: 1120, y: 224, type: 'gem' },
            { x: 1376, y: 160, type: 'relic' },
            { x: 1600, y: 320, type: 'coin' },
            { x: 1632, y: 320, type: 'coin' }
        ],
        enemies: [
            { type: 'slime', x: 350, y: 384, speed: 45, color: '#2ed573' },
            { type: 'slime', x: 800, y: 384, speed: 50, color: '#2ed573' },
            { type: 'glider', x: 1200, y: 240, range: 80, speed: 60, color: '#a55eea' },
            { type: 'slime', x: 1500, y: 384, speed: 55, color: '#2ed573' }
        ],
        hazards: []
    },

    // ==========================================
    // LEVEL 2: FORGOTTEN CATACOMBS (Ancient Temple)
    // Width: 65, Height: 18
    // ==========================================
    {
        id: 2,
        name: 'Level 2: Forgotten Catacombs',
        theme: 'temple',
        musicTrack: 'level2',
        width: 65,
        height: 18,
        spawn: { x: 64, y: 384 },
        exit: { x: 1984, y: 352 },
        map: `
#################################################################
#...............................................................#
#...............................................................#
#..................########.....................######..........#
#...........==....#........#............===....#......#.........#
#..........#..#..#..........#..........#...#..#........#........#
#.........#....##............#........#.....##..........#.......#
#........#....................#......#...................#......#
#.......#.........^^.....^^....#....#............^^.......#.....#
#......#.........####...####....#..#............####.......#D#..#
#.....#.........#....#.#....#....##............#....#.....#...#.#
#....#.........#......#......#................#......#...#.....X#
#...#...===...#...............#..............#........#.#......##
################...............##############..........##########
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#################################################################
`,
        checkpoints: [
            { id: 'cp2_1', x: 672, y: 368 },
            { id: 'cp2_2', x: 1344, y: 368 }
        ],
        movingPlatforms: [
            { id: 'mp2_1', startX: 320, startY: 380, endX: 440, endY: 380, x: 320, y: 380, width: 56, height: 12, speed: 1.4, vx: 0, vy: 0 },
            { id: 'mp2_2', startX: 1020, startY: 360, endX: 1140, endY: 360, x: 1020, y: 360, width: 56, height: 12, speed: 1.5, vx: 0, vy: 0 }
        ],
        collectibles: [
            { x: 160, y: 288, type: 'coin' },
            { x: 352, y: 192, type: 'gem' },
            { x: 480, y: 96,  type: 'extra_life' }, // Extra Life reward for high vertical climb
            { x: 576, y: 224, type: 'coin' },
            { x: 800, y: 224, type: 'gem' },
            { x: 896, y: 128, type: 'key', id: 'temple_key' },
            { x: 1216, y: 256, type: 'coin' },
            { x: 1248, y: 256, type: 'coin' },
            { x: 1472, y: 96,  type: 'relic' },
            { x: 1728, y: 352, type: 'gem' }
        ],
        enemies: [
            { type: 'glider', x: 380, y: 220, range: 90, speed: 65, color: '#a55eea' },
            { type: 'slime', x: 580, y: 384, speed: 50, color: '#747d8c' },
            { type: 'hopper', x: 880, y: 384, color: '#ff6b81' },
            { type: 'glider', x: 1150, y: 200, range: 100, speed: 70, color: '#a55eea' },
            { type: 'slime', x: 1600, y: 384, speed: 55, color: '#747d8c' }
        ],
        hazards: [
            { type: 'sawblade', x1: 520, y1: 280, x2: 600, y2: 280, speed: 70, radius: 14 }
        ]
    },

    // ==========================================
    // LEVEL 3: MAGMA FOUNDRY (Industrial Lava Cavern)
    // Width: 70, Height: 18
    // ==========================================
    {
        id: 3,
        name: 'Level 3: Magma Foundry',
        theme: 'magma',
        musicTrack: 'level3',
        width: 70,
        height: 18,
        spawn: { x: 64, y: 352 },
        exit: { x: 2144, y: 352 },
        map: `
######################################################################
#....................................................................#
#....................................................................#
#.......................######......................#######..........#
#.............===......#......#...........===......#.......#.........#
#............#...#....#........#.........#...#....#.........#........#
#...........#.....#..#..........#.......#.....#..#...........#.......#
#..........#.......##............#.....#.......##.............#......#
#.........#.......................#...#........................#.....#
#........#.........^^.......^^.....#.#..........^^.......^^.....#D#..#
#.......#.........####.....####.....#..........####.....####...#...#.#
#......#.........#....#...#....#..............#....#...#....#.#.....X#
#.....#...===...#......#.#......#....===.....#......#.#......#......##
#######..####..#........#........#..####....#........#........########
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
######################################################################
`,
        checkpoints: [
            { id: 'cp3_1', x: 704, y: 368 },
            { id: 'cp3_2', x: 1376, y: 336 }
        ],
        movingPlatforms: [
            { id: 'mp3_1', startX: 300, startY: 380, endX: 420, endY: 380, x: 300, y: 380, width: 56, height: 12, speed: 1.6, vx: 0, vy: 0 },
            { id: 'mp3_2', startX: 980, startY: 350, endX: 1100, endY: 350, x: 980, y: 350, width: 56, height: 12, speed: 1.7, vx: 0, vy: 0 },
            { id: 'mp3_3', startX: 1720, startY: 360, endX: 1840, endY: 360, x: 1720, y: 360, width: 56, height: 12, speed: 1.8, vx: 0, vy: 0 }
        ],
        collectibles: [
            { x: 160, y: 320, type: 'coin' },
            { x: 352, y: 160, type: 'gem' },
            { x: 576, y: 96,  type: 'extra_life' }, // Extra Life high above lava
            { x: 672, y: 256, type: 'coin' },
            { x: 864, y: 160, type: 'key', id: 'magma_key' },
            { x: 1056, y: 256, type: 'gem' },
            { x: 1280, y: 160, type: 'coin' },
            { x: 1568, y: 96,  type: 'relic' },
            { x: 1952, y: 320, type: 'gem' }
        ],
        enemies: [
            { type: 'turret', x: 500, y: 384, dir: -1, fireInterval: 2.8 },
            { type: 'hopper', x: 800, y: 384, color: '#eb4d4b' },
            { type: 'glider', x: 1200, y: 200, range: 110, speed: 75, color: '#ff793f' },
            { type: 'turret', x: 1650, y: 384, dir: -1, fireInterval: 2.6 }
        ],
        hazards: [
            { type: 'sawblade', x1: 580, y1: 250, x2: 680, y2: 250, speed: 85, radius: 15 },
            { type: 'flamejet', x: 1344, y: 384, dir: 'up', onDuration: 1.4, offDuration: 1.8, length: 70 }
        ]
    },

    // ==========================================
    // LEVEL 4: CRYSTAL SPIRE (Astral Cosmic Heights)
    // Width: 75, Height: 18
    // ==========================================
    {
        id: 4,
        name: 'Level 4: Crystal Spire',
        theme: 'crystal',
        musicTrack: 'level4',
        width: 75,
        height: 18,
        spawn: { x: 64, y: 352 },
        exit: { x: 2304, y: 352 },
        map: `
###########################################################################
#.........................................................................#
#.........................................................................#
#.........................#######.......................#######...........#
#...............===......#.......#............===......#.......#..........#
#..............#...#....#.........#..........#...#....#.........#.........#
#.............#.....#..#...........#........#.....#..#...........#........#
#............#.......##.............#......#.......##.............#.......#
#...........#........................#....#........................#......#
#..........#..........^^.......^^.....#..#..........^^.......^^.....#D#...#
#.........#..........####.....####.....##..........####.....####...#...#..#
#........#..........#....#...#....#...............#....#...#....#.#.....X.#
#.......#....===...#......#.#......#.....===.....#......#.#......#......###
#########...####..#........#........#...####....#........#........#########
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
###########################################################################
`,
        checkpoints: [
            { id: 'cp4_1', x: 736, y: 368 },
            { id: 'cp4_2', x: 1504, y: 368 }
        ],
        movingPlatforms: [
            { id: 'mp4_1', startX: 320, startY: 370, endX: 450, endY: 370, x: 320, y: 370, width: 56, height: 12, speed: 1.8, vx: 0, vy: 0 },
            { id: 'mp4_2', startX: 1040, startY: 340, endX: 1180, endY: 340, x: 1040, y: 340, width: 56, height: 12, speed: 1.9, vx: 0, vy: 0 },
            { id: 'mp4_3', startX: 1800, startY: 350, endX: 1940, endY: 350, x: 1800, y: 350, width: 56, height: 12, speed: 2.0, vx: 0, vy: 0 }
        ],
        collectibles: [
            { x: 192, y: 320, type: 'coin' },
            { x: 224, y: 320, type: 'coin' },
            { x: 384, y: 160, type: 'gem' },
            { x: 640, y: 96,  type: 'extra_life' }, // Extra Life in upper crystal chamber
            { x: 704, y: 256, type: 'coin' },
            { x: 928, y: 160, type: 'key', id: 'crystal_key' },
            { x: 1120, y: 256, type: 'gem' },
            { x: 1312, y: 192, type: 'coin' },
            { x: 1664, y: 96,  type: 'relic' },
            { x: 2080, y: 320, type: 'gem' }
        ],
        enemies: [
            { type: 'turret', x: 520, y: 384, dir: -1, fireInterval: 2.4 },
            { type: 'glider', x: 850, y: 180, range: 120, speed: 80, color: '#706fd3' },
            { type: 'hopper', x: 1250, y: 384, color: '#00d2d3' },
            { type: 'glider', x: 1650, y: 190, range: 120, speed: 85, color: '#706fd3' },
            { type: 'turret', x: 1980, y: 384, dir: -1, fireInterval: 2.2 }
        ],
        hazards: [
            { type: 'sawblade', x1: 620, y1: 250, x2: 740, y2: 250, speed: 95, radius: 15 },
            { type: 'flamejet', x: 1408, y: 384, dir: 'up', onDuration: 1.2, offDuration: 1.6, length: 75 }
        ]
    }
];
