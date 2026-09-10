// js/audio.js - Web Audio API Procedural Sound & Chiptune Music Engine
import { saveSystem } from './saveSystem.js';

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.isMuted = false;
        
        this.currentTrack = null;
        this.musicTimer = null;
        this.musicSequenceStep = 0;
        this.tempo = 125; // BPM
        this.isPlayingMusic = false;

        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();

            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            const settings = saveSystem.getSettings();
            this.setMasterVolume(settings.masterVolume);
            this.setMusicVolume(settings.musicVolume);
            this.setSfxVolume(settings.sfxVolume);
            this.setMuted(settings.muted);

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked.', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMasterVolume(val) {
        if (!this.masterGain) return;
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : val, this.ctx.currentTime);
    }

    setMusicVolume(val) {
        if (!this.musicGain) return;
        this.musicGain.gain.setValueAtTime(val * 0.4, this.ctx.currentTime);
    }

    setSfxVolume(val) {
        if (!this.sfxGain) return;
        this.sfxGain.gain.setValueAtTime(val * 0.6, this.ctx.currentTime);
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (!this.masterGain) return;
        const settings = saveSystem.getSettings();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : settings.masterVolume, this.ctx.currentTime);
    }

    // ==========================================
    // SOUND EFFECTS SYNTHESIS
    // ==========================================
    playSfx(type) {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        switch (type) {
            case 'jump': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(140, t);
                osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.13);
                break;
            }
            case 'land': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(100, t);
                osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.08);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.09);
                break;
            }
            case 'coin': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, t); // B5
                osc.frequency.setValueAtTime(1318.51, t + 0.07); // E6
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.22);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.23);
                break;
            }
            case 'gem': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, t); // C5
                osc.frequency.setValueAtTime(659.25, t + 0.05); // E5
                osc.frequency.setValueAtTime(783.99, t + 0.10); // G5
                osc.frequency.setValueAtTime(1046.50, t + 0.15); // C6
                gain.gain.setValueAtTime(0.25, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.36);
                break;
            }
            case 'extra_life': {
                // Triumphant 5-note jingle
                const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, t + idx * 0.08);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.setValueAtTime(0.25, t + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
                    osc.connect(gain);
                    gain.connect(this.sfxGain);
                    osc.start(t + idx * 0.08);
                    osc.stop(t + idx * 0.08 + 0.26);
                });
                break;
            }
            case 'checkpoint': {
                // Harmonic uplifting chime
                const freqs = [440, 554.37, 659.25, 880];
                freqs.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, t + i * 0.06);
                    gain.gain.setValueAtTime(0.2, t + i * 0.06);
                    gain.gain.linearRampToValueAtTime(0.001, t + i * 0.06 + 0.4);
                    osc.connect(gain);
                    gain.connect(this.sfxGain);
                    osc.start(t + i * 0.06);
                    osc.stop(t + i * 0.06 + 0.41);
                });
                break;
            }
            case 'stomp': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(220, t);
                osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
                gain.gain.setValueAtTime(0.25, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.13);
                break;
            }
            case 'hurt': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, t);
                osc.frequency.linearRampToValueAtTime(80, t + 0.2);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.21);
                break;
            }
            case 'death': {
                // Downward chromatic decay
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, t);
                osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);
                gain.gain.setValueAtTime(0.35, t);
                gain.gain.linearRampToValueAtTime(0.001, t + 0.6);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.62);
                break;
            }
            case 'key': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, t); // D5
                osc.frequency.setValueAtTime(880.00, t + 0.08); // A5
                gain.gain.setValueAtTime(0.25, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.26);
                break;
            }
            case 'unlock': {
                const notes = [300, 450, 600, 900];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, t + idx * 0.06);
                    gain.gain.setValueAtTime(0.2, t + idx * 0.06);
                    gain.gain.linearRampToValueAtTime(0.001, t + idx * 0.06 + 0.15);
                    osc.connect(gain);
                    gain.connect(this.sfxGain);
                    osc.start(t + idx * 0.06);
                    osc.stop(t + idx * 0.06 + 0.16);
                });
                break;
            }
            case 'laser': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.13);
                break;
            }
            case 'level_complete': {
                const chords = [
                    [523.25, 659.25, 783.99], // C
                    [587.33, 739.99, 880.00], // D
                    [659.25, 830.61, 987.77], // E
                    [783.99, 987.77, 1174.66, 1567.98] // G + high G
                ];
                chords.forEach((chord, i) => {
                    chord.forEach(f => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(f, t + i * 0.18);
                        gain.gain.setValueAtTime(0.12, t + i * 0.18);
                        gain.gain.linearRampToValueAtTime(0.001, t + i * 0.18 + (i === 3 ? 0.7 : 0.22));
                        osc.connect(gain);
                        gain.connect(this.sfxGain);
                        osc.start(t + i * 0.18);
                        osc.stop(t + i * 0.18 + (i === 3 ? 0.75 : 0.23));
                    });
                });
                break;
            }
            case 'ui_click': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.04);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.05);
                break;
            }
            case 'ui_hover': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, t);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.linearRampToValueAtTime(0.001, t + 0.03);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + 0.04);
                break;
            }
        }
    }

    // ==========================================
    // POLYPHONIC CHIPTUNE MUSIC ENGINE
    // ==========================================
    playMusic(trackName) {
        if (!this.initialized) this.init();
        this.resume();

        if (this.currentTrack === trackName && this.isPlayingMusic) return;
        this.stopMusic();

        this.currentTrack = trackName;
        this.isPlayingMusic = true;
        this.musicSequenceStep = 0;

        const trackData = this.getTrackData(trackName);
        if (!trackData) return;

        const stepDuration = (60 / trackData.bpm) / 4; // 16th notes
        const scheduleNext = () => {
            if (!this.isPlayingMusic || this.currentTrack !== trackName) return;

            const t = this.ctx.currentTime;
            const leadFreq = trackData.lead[this.musicSequenceStep % trackData.lead.length];
            const bassFreq = trackData.bass[this.musicSequenceStep % trackData.bass.length];
            const arpFreq = trackData.arp ? trackData.arp[this.musicSequenceStep % trackData.arp.length] : 0;
            const isDrum = trackData.drums ? trackData.drums[this.musicSequenceStep % trackData.drums.length] : 0;

            if (leadFreq > 0) {
                this.playNote(leadFreq, stepDuration * 0.9, 'square', 0.08, t);
            }
            if (bassFreq > 0) {
                this.playNote(bassFreq, stepDuration * 0.8, 'triangle', 0.15, t);
            }
            if (arpFreq > 0) {
                this.playNote(arpFreq, stepDuration * 0.5, 'sawtooth', 0.03, t);
            }
            if (isDrum === 1) { // Kick
                this.playDrumKick(t);
            } else if (isDrum === 2) { // Snare / Hi-hat
                this.playDrumSnare(t);
            }

            this.musicSequenceStep++;
            this.musicTimer = setTimeout(scheduleNext, stepDuration * 1000);
        };

        scheduleNext();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    playNote(freq, duration, type, volume, time) {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    playDrumKick(time) {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.1);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + 0.11);
    }

    playDrumSnare(time) {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.08);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + 0.09);
    }

    getTrackData(trackName) {
        // Musical note frequencies (Hz)
        const C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196.00, A3=220.00, B3=246.94;
        const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88;
        const C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99, A5=880.00, B5=987.77;
        const _ = 0;

        switch (trackName) {
            case 'menu':
                return {
                    bpm: 120,
                    lead: [C4, _, E4, _, G4, _, C5, _, B4, _, G4, _, E4, _, D4, _],
                    bass: [C3, C3, _, C3, G3, G3, _, G3, A3, A3, _, A3, F3, F3, _, F3],
                    arp:  [C5, E5, G5, E5, B4, D5, G5, D5, A4, C5, E5, C5, F4, A4, C5, A4],
                    drums:[1,  0,  2,  0,  1,  0,  2,  0,  1,  0,  2,  0,  1,  0,  2,  2]
                };
            case 'level1': // Forest Ruins - energetic adventure
                return {
                    bpm: 132,
                    lead: [E4, _, G4, A4, B4, _, D5, B4, A4, _, G4, E4, D4, _, E4, _,
                           G4, _, A4, B4, D5, _, E5, D5, B4, _, A4, G4, A4, _, _, _],
                    bass: [E3, _, E3, _, G3, _, G3, _, A3, _, A3, _, C3, _, D3, _,
                           E3, _, E3, _, G3, _, G3, _, D3, _, D3, _, B3, _, D3, _],
                    arp:  [E4, G4, B4, E5, G4, B4, D5, G5, A4, C5, E5, A5, C4, E4, G4, C5,
                           E4, G4, B4, E5, G4, B4, D5, G5, D4, F4, A4, D5, B3, D4, G4, B4],
                    drums:[1,  0,  2,  0,  1,  1,  2,  0,  1,  0,  2,  0,  1,  2,  2,  0]
                };
            case 'level2': // Ancient Catacombs - mysterious & pulsating
                return {
                    bpm: 118,
                    lead: [A4, _, C5, _, B4, _, _, A4, G4, _, A4, _, E4, _, _, _,
                           F4, _, A4, _, G4, _, E4, _, D4, _, E4, _, A3, _, _, _],
                    bass: [A3, A3, _, A3, E3, E3, _, E3, F3, F3, _, F3, D3, D3, _, D3,
                           A3, A3, _, A3, C3, C3, _, C3, D3, D3, _, D3, E3, E3, _, E3],
                    arp:  [A4, C5, E5, A4, E4, G4, B4, E4, F4, A4, C5, F4, D4, F4, A4, D4],
                    drums:[1,  0,  0,  2,  1,  0,  2,  0,  1,  0,  0,  2,  1,  0,  2,  2]
                };
            case 'level3': // Magma Caverns - driving bass & high tension
                return {
                    bpm: 140,
                    lead: [D4, _, F4, _, G4, _, A4, _, D5, _, C5, _, A4, _, F4, _,
                           G4, _, A4, _, C5, _, D5, _, F5, _, E5, _, D5, _, _, _],
                    bass: [D3, D3, D3, _, F3, F3, F3, _, G3, G3, G3, _, A3, A3, A3, _,
                           D3, D3, D3, _, C3, C3, C3, _, B3, B3, B3, _, A3, A3, A3, _],
                    arp:  [D4, F4, A4, D5, F4, A4, C5, F5, G4, B4, D5, G5, A4, C5, E5, A5],
                    drums:[1,  2,  1,  2,  1,  2,  1,  2,  1,  2,  1,  2,  1,  1,  2,  2]
                };
            case 'level4': // Crystal Spire - majestic astral heights
                return {
                    bpm: 135,
                    lead: [E4, G4, B4, E5, D5, B4, G4, _, A4, C5, E5, A5, G5, E5, C5, _,
                           B4, D5, F5, B5, A5, F5, D5, _, E5, _, B4, _, G4, _, E4, _],
                    bass: [E3, _, E3, B3, C3, _, C3, G3, D3, _, D3, A3, E3, _, B3, E3],
                    arp:  [E5, B5, G5, E5, C5, G5, E5, C5, D5, A5, F5, D5, E5, B5, G5, E5],
                    drums:[1,  0,  2,  1,  1,  0,  2,  0,  1,  0,  2,  1,  1,  2,  2,  2]
                };
            case 'gameover':
                return {
                    bpm: 85,
                    lead: [E4, _, D4, _, C4, _, B3, _, A3, _, _, _, _, _, _, _],
                    bass: [A3, _, _, A3, G3, _, _, G3, F3, _, _, F3, E3, _, _, _],
                    arp:  [A4, E4, C4, A3, G4, D4, B3, G3, F4, C4, A3, F3, E4, B3, G3, E3],
                    drums:[1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0]
                };
            case 'victory':
                return {
                    bpm: 130,
                    lead: [C4, _, E4, _, G4, _, C5, _, D5, _, F5, _, G5, _, C6, _,
                           G5, _, E5, _, C5, _, G4, _, C5, _, _, _, _, _, _, _],
                    bass: [C3, C3, _, C3, G3, G3, _, G3, A3, A3, _, A3, F3, F3, _, F3,
                           C3, C3, _, C3, E3, E3, _, E3, C3, C3, _, C3, C3, _, _, _],
                    arp:  [C5, E5, G5, C6, G4, B4, D5, G5, A4, C5, E5, A5, F4, A4, C5, F5],
                    drums:[1,  0,  2,  0,  1,  0,  2,  0,  1,  0,  2,  0,  1,  1,  2,  2]
                };
            default:
                return null;
        }
    }
}

export const audioManager = new AudioManager();

