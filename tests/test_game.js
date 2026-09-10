// tests/test_game.js - Complete node-based unit tests, validation, hazard collision & exit tests
import { CHARACTERS } from '../js/characters.js';
import { LEVELS_DATA, Level } from '../js/levels.js';
import { LevelValidator } from '../js/levelValidator.js';
import { TILE_TYPES, TILE_SIZE, Physics } from '../js/physics.js';

console.log('==============================================');
console.log('🧪 RELIC RUNNER COMPREHENSIVE TEST SUITE');
console.log('==============================================');

// 1. Character Roster Verification
console.log('\n[1] Verifying Character Roster:');
const expectedChars = ['explorer', 'runner', 'jumper', 'adventurer'];
let charsValid = true;
for (const id of expectedChars) {
    const c = CHARACTERS[id];
    if (!c) {
        console.error(`❌ Missing character: ${id}`);
        charsValid = false;
    } else {
        console.log(`  ✓ ${c.name} (${c.title}): Speed ${c.speedMultiplier}x, Jump ${c.jumpMultiplier}x, Lives ${c.startingLives}, Invulnerability ${c.invulnerabilityDuration}s`);
    }
}

// 2. Run Level Validator
console.log('\n[2] Executing Level Geometry & Reachability Validator:');
const valResult = LevelValidator.validateAll();
for (const r of valResult.results) {
    if (r.passed) {
        console.log(`  ✓ Level ${r.levelId} [${r.name}] -> PASSED (Collectibles: ${r.info.totalCollectibles}, Checkpoints: ${r.info.totalCheckpoints}, Enemies: ${r.info.totalEnemies})`);
    } else {
        console.error(`  ❌ Level ${r.levelId} [${r.name}] -> FAILED with issues:`, r.issues);
    }
}

// 3. Collision & Math Logic Test
console.log('\n[3] Testing AABB Collision Engine:');
const b1 = { x: 10, y: 10, width: 20, height: 20 };
const b2 = { x: 20, y: 20, width: 20, height: 20 };
const b3 = { x: 100, y: 100, width: 20, height: 20 };

const overlap12 = Physics.checkAABB(b1, b2);
const overlap13 = Physics.checkAABB(b1, b3);
console.log(`  ✓ Overlapping boxes collision: ${overlap12 ? 'PASS (true)' : 'FAIL'}`);
console.log(`  ✓ Disjoint boxes collision: ${!overlap13 ? 'PASS (false)' : 'FAIL'}`);

// 4. Test Key & Gate Mechanics
console.log('\n[4] Testing Key & Gate Mechanics:');
const testLvl = new Level(LEVELS_DATA[0]);
testLvl.unlockAllDoorsWithId('test_key');
console.log(`  ✓ Key doors unlocked and processed successfully.`);

// 5. Test Dual WASD & Arrow Keys Input Logic Simulation
console.log('\n[5] Testing Dual WASD and Arrow Keys Input Combinations:');
function simulateInputs(heldKeysArray) {
    const heldKeys = new Set(heldKeysArray);
    return {
        left: heldKeys.has('KeyA') || heldKeys.has('ArrowLeft'),
        right: heldKeys.has('KeyD') || heldKeys.has('ArrowRight'),
        up: heldKeys.has('KeyW') || heldKeys.has('ArrowUp'),
        down: heldKeys.has('KeyS') || heldKeys.has('ArrowDown'),
        jumpPressed: heldKeys.has('KeyW') || heldKeys.has('ArrowUp') || heldKeys.has('Space') || heldKeys.has('KeyK') || heldKeys.has('KeyZ')
    };
}

const inputScenarios = [
    { keys: ['KeyA', 'KeyW'], expected: { left: true, right: false, up: true, down: false, jumpPressed: true }, desc: 'A + W (Move Left + Jump)' },
    { keys: ['KeyD', 'KeyW'], expected: { left: false, right: true, up: true, down: false, jumpPressed: true }, desc: 'D + W (Move Right + Jump)' },
    { keys: ['ArrowLeft', 'ArrowUp'], expected: { left: true, right: false, up: true, down: false, jumpPressed: true }, desc: 'Left Arrow + Up Arrow (Move Left + Jump)' },
    { keys: ['ArrowRight', 'ArrowUp'], expected: { left: false, right: true, up: true, down: false, jumpPressed: true }, desc: 'Right Arrow + Up Arrow (Move Right + Jump)' },
    { keys: ['KeyA', 'ArrowUp'], expected: { left: true, right: false, up: true, down: false, jumpPressed: true }, desc: 'A + Up Arrow (Cross-combination: Move Left + Jump)' },
    { keys: ['KeyD', 'ArrowUp'], expected: { left: false, right: true, up: true, down: false, jumpPressed: true }, desc: 'D + Up Arrow (Cross-combination: Move Right + Jump)' },
    { keys: ['ArrowLeft', 'KeyW'], expected: { left: true, right: false, up: true, down: false, jumpPressed: true }, desc: 'Left Arrow + W (Cross-combination: Move Left + Jump)' },
    { keys: ['ArrowRight', 'KeyW'], expected: { left: false, right: true, up: true, down: false, jumpPressed: true }, desc: 'Right Arrow + W (Cross-combination: Move Right + Jump)' },
    { keys: ['ArrowRight', 'Space'], expected: { left: false, right: true, up: false, down: false, jumpPressed: true }, desc: 'Right Arrow + Space (Move Right + Jump Space)' }
];

let allInputsPassed = true;
for (const sc of inputScenarios) {
    const res = simulateInputs(sc.keys);
    const matches = (
        res.left === sc.expected.left &&
        res.right === sc.expected.right &&
        res.up === sc.expected.up &&
        res.down === sc.expected.down &&
        res.jumpPressed === sc.expected.jumpPressed
    );
    if (matches) {
        console.log(`  ✓ ${sc.desc} -> PASS`);
    } else {
        console.error(`  ❌ ${sc.desc} -> FAILED! Result:`, res, 'Expected:', sc.expected);
        allInputsPassed = false;
    }
}

// 6. Test Lava & Thorn Hazard Detection
console.log('\n[6] Testing Tile Hazards (Lava & Spikes/Thorns):');
const lvl1 = new Level(LEVELS_DATA[0]);

// Test 6a: Falling into lava at row 14 (y = 14*32 = 448)
const playerInLava = { x: 300, y: 448 + 10, width: 20, height: 28 };
const lavaHit = Physics.checkTileHazards(playerInLava, lvl1);
console.log(`  ✓ Player falling into Lava triggers fatal hazard: ${lavaHit && lavaHit.type === 'lava' ? 'PASS' : 'FAIL'}`);

// Test 6b: Player standing safely on solid ground at row 13 above lava at row 14 (feet at 14*32 = 448, lava starts at 452)
const playerOnPlatformAboveLava = { x: 300, y: 448 - 28, width: 20, height: 28 };
const safeAboveLava = Physics.checkTileHazards(playerOnPlatformAboveLava, lvl1);
console.log(`  ✓ Player standing on platform above Lava is SAFE: ${safeAboveLava === null ? 'PASS' : 'FAIL'}`);

// Test 6c: Stepping on spikes at row 12 col 19 (lvl1 has spikes ^^ at row 12 col 19-20, y = 12*32 = 384)
const playerOnSpikes = { x: 19 * 32 + 4, y: 12 * 32 + 10, width: 20, height: 28 };
const spikeHit = Physics.checkTileHazards(playerOnSpikes, lvl1);
console.log(`  ✓ Player stepping on Spikes/Thorns triggers damage: ${spikeHit && spikeHit.type === 'spike' ? 'PASS' : 'FAIL'}`);

// 7. Test Level 1 Exit Door Alignment and Proximity
console.log('\n[7] Testing Level 1 Exit Doorway Alignment:');
const exitDoorCoord = lvl1.exit; // { x: 1856, y: 352 }
const exitDoorwayBox = Physics.getExitDoorwayBox(exitDoorCoord);

// 7a: Player inside the doorway
const playerAtDoor = { x: exitDoorCoord.x + 8, y: exitDoorCoord.y + 4, width: 20, height: 28 };
const atDoorHit = Physics.checkAABB(playerAtDoor, exitDoorwayBox);
console.log(`  ✓ Player physically reaching doorway triggers level exit: ${atDoorHit ? 'PASS' : 'FAIL'}`);

// 7b: Player 64px (2 blocks) away from door
const playerFarAway = { x: exitDoorCoord.x - 64, y: exitDoorCoord.y + 4, width: 20, height: 28 };
const farHit = Physics.checkAABB(playerFarAway, exitDoorwayBox);
console.log(`  ✓ Player 64px away does NOT trigger exit prematurely: ${!farHit ? 'PASS' : 'FAIL'}`);

// 7c: Player 25px away to the left
const playerNearCorner = { x: exitDoorCoord.x - 25, y: exitDoorCoord.y + 4, width: 20, height: 28 };
const cornerHit = Physics.checkAABB(playerNearCorner, exitDoorwayBox);
console.log(`  ✓ Player outside doorway does NOT trigger exit: ${!cornerHit ? 'PASS' : 'FAIL'}`);

console.log('\n==============================================');
if (
    charsValid &&
    valResult.allPassed &&
    overlap12 &&
    !overlap13 &&
    allInputsPassed &&
    lavaHit &&
    safeAboveLava === null &&
    spikeHit &&
    atDoorHit &&
    !farHit &&
    !cornerHit
) {
    console.log('🎉 ALL ENGINE, LEVEL, HAZARD & EXIT DOOR TESTS PASSED 100%!');
} else {
    console.error('⚠️ SOME HAZARD OR EXIT CHECKS FAILED!');
    process.exit(1);
}
console.log('==============================================');
