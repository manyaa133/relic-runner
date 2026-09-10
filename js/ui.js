// js/ui.js - HUD, Menus, Modals, Character Select & Notifications Controller

import { CHARACTERS } from './characters.js';
import { saveSystem } from './saveSystem.js';
import { audioManager } from './audio.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // Overlay Elements
        this.hud = document.getElementById('hud');
        this.mainMenu = document.getElementById('main-menu');
        this.charSelectMenu = document.getElementById('char-select-menu');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOverMenu = document.getElementById('game-over-menu');
        this.victoryMenu = document.getElementById('victory-menu');
        this.settingsModal = document.getElementById('settings-modal');
        this.howToPlayModal = document.getElementById('how-to-play-modal');

        // HUD Elements
        this.charIcon = document.getElementById('hud-char-icon');
        this.charName = document.getElementById('hud-char-name');
        this.livesCount = document.getElementById('hud-lives-count');
        this.levelName = document.getElementById('hud-level-name');
        this.relicIndicator = document.getElementById('hud-relic-indicator');
        this.scoreVal = document.getElementById('hud-score');
        this.keysCount = document.getElementById('hud-keys');

        // Setup Event Listeners
        this.setupMenuButtons();
        this.setupSettingsControls();
        this.setupCharacterCards();
    }

    setupMenuButtons() {
        // Main Menu
        document.getElementById('btn-new-game').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.startNewGame(1);
        });

        const btnContinue = document.getElementById('btn-continue');
        btnContinue.addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            const maxLvl = saveSystem.data.maxLevelUnlocked || 1;
            this.game.startNewGame(maxLvl);
        });

        document.getElementById('btn-char-select').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.showCharacterSelect();
        });

        document.getElementById('btn-how-to-play').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.showHowToPlay();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.showSettings();
        });

        // Pause Menu
        document.getElementById('btn-resume').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.togglePause();
        });

        document.getElementById('btn-restart-checkpoint').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.restartFromCheckpoint();
        });

        document.getElementById('btn-restart-level').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.restartLevel();
        });

        document.getElementById('btn-pause-settings').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.showSettings();
        });

        document.getElementById('btn-pause-main-menu').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.returnToMainMenu();
        });

        // Game Over Menu
        document.getElementById('btn-gameover-restart').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.startNewGame(1); // Restart from Level 1
        });

        document.getElementById('btn-gameover-char-select').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.showCharacterSelect();
        });

        document.getElementById('btn-gameover-main-menu').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.returnToMainMenu();
        });

        // Victory Menu
        document.getElementById('btn-victory-replay').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.startNewGame(1);
        });

        document.getElementById('btn-victory-main-menu').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.game.returnToMainMenu();
        });

        // Modal close buttons
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.hideSettings();
        });

        document.getElementById('btn-close-how-to-play').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.hideHowToPlay();
        });

        document.getElementById('btn-back-char-select').addEventListener('click', () => {
            audioManager.playSfx('ui_click');
            this.showMainMenu();
        });

        // Fullscreen Mode Handlers
        const toggleFullscreen = () => {
            audioManager.playSfx('ui_click');
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
        };

        const hudFsBtn = document.getElementById('btn-hud-fullscreen');
        if (hudFsBtn) hudFsBtn.addEventListener('click', toggleFullscreen);

        const settingsFsBtn = document.getElementById('btn-toggle-fullscreen');
        if (settingsFsBtn) settingsFsBtn.addEventListener('click', toggleFullscreen);
    }

    setupSettingsControls() {
        const settings = saveSystem.getSettings();

        const masterVol = document.getElementById('setting-master-volume');
        const musicVol = document.getElementById('setting-music-volume');
        const sfxVol = document.getElementById('setting-sfx-volume');
        const muteToggle = document.getElementById('setting-mute');
        const crtToggle = document.getElementById('setting-crt');
        const shakeToggle = document.getElementById('setting-screenshake');

        if (masterVol) {
            masterVol.value = settings.masterVolume * 100;
            masterVol.addEventListener('input', (e) => {
                const val = e.target.value / 100;
                audioManager.setMasterVolume(val);
                saveSystem.updateSettings({ masterVolume: val });
            });
        }

        if (musicVol) {
            musicVol.value = settings.musicVolume * 100;
            musicVol.addEventListener('input', (e) => {
                const val = e.target.value / 100;
                audioManager.setMusicVolume(val);
                saveSystem.updateSettings({ musicVolume: val });
            });
        }

        if (sfxVol) {
            sfxVol.value = settings.sfxVolume * 100;
            sfxVol.addEventListener('input', (e) => {
                const val = e.target.value / 100;
                audioManager.setSfxVolume(val);
                saveSystem.updateSettings({ sfxVolume: val });
            });
        }

        if (muteToggle) {
            muteToggle.checked = settings.muted;
            muteToggle.addEventListener('change', (e) => {
                const muted = e.target.checked;
                audioManager.setMuted(muted);
                saveSystem.updateSettings({ muted });
            });
        }

        if (crtToggle) {
            crtToggle.checked = settings.crtEffect;
            this.applyCrtEffect(settings.crtEffect);
            crtToggle.addEventListener('change', (e) => {
                const on = e.target.checked;
                this.applyCrtEffect(on);
                saveSystem.updateSettings({ crtEffect: on });
            });
        }

        if (shakeToggle) {
            shakeToggle.checked = settings.screenShake;
            shakeToggle.addEventListener('change', (e) => {
                saveSystem.updateSettings({ screenShake: e.target.checked });
            });
        }
    }

    applyCrtEffect(enabled) {
        const overlay = document.getElementById('crt-overlay');
        if (overlay) {
            overlay.style.display = enabled ? 'block' : 'none';
        }
    }

    setupCharacterCards() {
        const container = document.getElementById('character-cards-container');
        if (!container) return;

        container.innerHTML = '';
        const curChar = saveSystem.data.selectedCharacter || 'explorer';

        for (const [id, char] of Object.entries(CHARACTERS)) {
            const card = document.createElement('div');
            card.className = `character-card ${id === curChar ? 'selected' : ''}`;
            card.dataset.charId = id;

            card.innerHTML = `
                <div class="char-card-header" style="border-color: ${char.colors.primary};">
                    <div class="char-portrait-preview" style="background: ${char.colors.primary};"></div>
                    <div class="char-card-titles">
                        <div class="char-name">${char.name}</div>
                        <div class="char-subtitle">${char.title}</div>
                    </div>
                </div>
                <div class="char-desc">${char.description}</div>
                <div class="char-stats">
                    <div class="stat-row"><span>Speed</span><div class="stat-bar"><div class="stat-fill" style="width: ${char.stats.speed * 20}%; background: #00d2d3;"></div></div></div>
                    <div class="stat-row"><span>Jump</span><div class="stat-bar"><div class="stat-fill" style="width: ${char.stats.jump * 20}%; background: #2ed573;"></div></div></div>
                    <div class="stat-row"><span>Lives</span><div class="stat-bar"><div class="stat-fill" style="width: ${char.stats.lives * 20}%; background: #ff4757;"></div></div></div>
                    <div class="stat-row"><span>Defense</span><div class="stat-bar"><div class="stat-fill" style="width: ${char.stats.defense * 20}%; background: #ffa502;"></div></div></div>
                </div>
                <button class="btn btn-select-char ${id === curChar ? 'active' : ''}">
                    ${id === curChar ? 'SELECTED' : 'CHOOSE HERO'}
                </button>
            `;

            card.querySelector('.btn-select-char').addEventListener('click', () => {
                audioManager.playSfx('ui_click');
                this.selectCharacter(id);
            });

            container.appendChild(card);
        }
    }

    selectCharacter(charId) {
        saveSystem.setSelectedCharacter(charId);
        this.game.player.setCharacter(charId);

        // Update UI card selections
        document.querySelectorAll('.character-card').forEach(card => {
            const isMatch = card.dataset.charId === charId;
            card.classList.toggle('selected', isMatch);
            const btn = card.querySelector('.btn-select-char');
            btn.classList.toggle('active', isMatch);
            btn.textContent = isMatch ? 'SELECTED' : 'CHOOSE HERO';
        });

        this.updateHUD();
    }

    updateHUD() {
        if (!this.game.player) return;

        const char = this.game.player.character;
        if (this.charName) this.charName.textContent = char.name.split(' ')[0];
        if (this.charIcon) this.charIcon.style.backgroundColor = char.colors.primary;

        // Lives
        if (this.livesCount) {
            let heartsHtml = '';
            for (let i = 0; i < this.game.player.lives; i++) {
                heartsHtml += '<span class="hud-heart">❤️</span>';
            }
            this.livesCount.innerHTML = heartsHtml;
        }

        // Level & Relic
        if (this.levelName && this.game.currentLevel) {
            this.levelName.textContent = this.game.currentLevel.name;
        }

        if (this.relicIndicator) {
            this.relicIndicator.className = this.game.hasRelic ? 'relic-found' : 'relic-missing';
            this.relicIndicator.title = this.game.hasRelic ? 'Relic Found: Exit Open!' : 'Find the Sacred Relic to unlock the portal';
        }

        // Score & Keys
        if (this.scoreVal) this.scoreVal.textContent = this.game.score.toString().padStart(6, '0');
        if (this.keysCount) this.keysCount.textContent = this.game.keys.size;
    }

    // Modal & Menu Navigation
    showMainMenu() {
        this.hideAllMenus();
        this.mainMenu.style.display = 'flex';
        this.hud.style.display = 'none';

        // Check if continue is available
        const maxLvl = saveSystem.data.maxLevelUnlocked || 1;
        const btnContinue = document.getElementById('btn-continue');
        if (btnContinue) {
            btnContinue.disabled = (maxLvl <= 1);
            btnContinue.title = maxLvl > 1 ? `Continue from Level ${maxLvl}` : 'No saved progress yet';
        }

        // High Score
        const hsEl = document.getElementById('menu-high-score');
        if (hsEl) hsEl.textContent = `HIGH SCORE: ${saveSystem.data.highScore.toString().padStart(6, '0')}`;

        audioManager.playMusic('menu');
    }

    showInGameHUD() {
        this.hideAllMenus();
        this.hud.style.display = 'flex';
        this.updateHUD();
    }

    showCharacterSelect() {
        this.hideAllMenus();
        this.charSelectMenu.style.display = 'flex';
        this.setupCharacterCards();
    }

    showPauseMenu() {
        this.pauseMenu.style.display = 'flex';
        const hasCp = (this.game.lastCheckpointId !== null);
        const btnCp = document.getElementById('btn-restart-checkpoint');
        if (btnCp) btnCp.disabled = !hasCp;
    }

    hidePauseMenu() {
        this.pauseMenu.style.display = 'none';
    }

    showGameOver(stats) {
        this.hideAllMenus();
        this.gameOverMenu.style.display = 'flex';

        document.getElementById('gameover-score').textContent = stats.score.toString().padStart(6, '0');
        document.getElementById('gameover-level').textContent = stats.levelName;

        audioManager.playMusic('gameover');
    }

    showVictory(stats) {
        this.hideAllMenus();
        this.victoryMenu.style.display = 'flex';

        document.getElementById('victory-score').textContent = stats.score.toString().padStart(6, '0');
        document.getElementById('victory-time').textContent = `${Math.floor(stats.time)}s`;

        audioManager.playMusic('victory');
    }

    showSettings() {
        this.settingsModal.style.display = 'flex';
    }

    hideSettings() {
        this.settingsModal.style.display = 'none';
    }

    showHowToPlay() {
        this.howToPlayModal.style.display = 'flex';
    }

    hideHowToPlay() {
        this.howToPlayModal.style.display = 'none';
    }

    hideAllMenus() {
        this.mainMenu.style.display = 'none';
        this.charSelectMenu.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        this.gameOverMenu.style.display = 'none';
        this.victoryMenu.style.display = 'none';
        this.settingsModal.style.display = 'none';
        this.howToPlayModal.style.display = 'none';
    }
}

