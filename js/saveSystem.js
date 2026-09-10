// js/saveSystem.js - LocalStorage persistence for progress, settings, and high scores

const SAVE_KEY = 'relic_runner_save_data_v1';

const defaultData = {
    highScore: 0,
    maxLevelUnlocked: 1,
    selectedCharacter: 'explorer',
    settings: {
        masterVolume: 0.8,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        muted: false,
        crtEffect: true,
        screenShake: true
    },
    statistics: {
        totalCoins: 0,
        totalGems: 0,
        totalDeaths: 0,
        levelsCompleted: 0
    }
};

class SaveSystem {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                return JSON.parse(JSON.stringify(defaultData));
            }
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(defaultData));
            const parsed = JSON.parse(raw);
            return {
                ...defaultData,
                ...parsed,
                settings: { ...defaultData.settings, ...(parsed.settings || {}) },
                statistics: { ...defaultData.statistics, ...(parsed.statistics || {}) }
            };
        } catch (e) {
            return JSON.parse(JSON.stringify(defaultData));
        }
    }

    save() {
        try {
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not write to localStorage.', e);
        }
    }

    getSettings() {
        return this.data.settings;
    }

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }

    updateHighScore(score) {
        if (score > this.data.highScore) {
            this.data.highScore = score;
            this.save();
            return true;
        }
        return false;
    }

    unlockLevel(levelNum) {
        if (levelNum > this.data.maxLevelUnlocked) {
            this.data.maxLevelUnlocked = levelNum;
            this.save();
        }
    }

    setSelectedCharacter(id) {
        this.data.selectedCharacter = id;
        this.save();
    }

    recordStats(coins = 0, gems = 0, deaths = 0, completed = false) {
        this.data.statistics.totalCoins += coins;
        this.data.statistics.totalGems += gems;
        this.data.statistics.totalDeaths += deaths;
        if (completed) this.data.statistics.levelsCompleted += 1;
        this.save();
    }

    resetAll() {
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.save();
    }
}

export const saveSystem = new SaveSystem();
