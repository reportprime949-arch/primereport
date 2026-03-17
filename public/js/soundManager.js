/**
 * SoundManager - Intelligent Audio Queue System
 */
class SoundManager {
    constructor() {
        this.sounds = {
            success: '/sounds/success.mp3',
            error: '/sounds/error.mp3',
            warning: '/sounds/warning.mp3',
            info: '/sounds/info.mp3'
        };
        this.audioCache = {};
        this.queue = [];
        this.isPlaying = false;
        this.volume = parseFloat(localStorage.getItem('admin_sound_volume') || '0.7');
        this.isMuted = localStorage.getItem('admin_sound_muted') === 'true';
        this.isUnlocked = false;

        this.init();
    }

    init() {
        // Unlock audio on first interaction
        const unlock = () => {
            this.isUnlocked = true;
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('keydown', unlock);

        // Preload sounds
        Object.entries(this.sounds).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.load();
            this.audioCache[key] = audio;
        });
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        localStorage.setItem('admin_sound_volume', this.volume);
    }

    setMuted(m) {
        this.isMuted = m;
        localStorage.setItem('admin_sound_muted', this.isMuted);
    }

    play(type) {
        if (this.isMuted || !this.isUnlocked) return;
        
        const sound = this.audioCache[type];
        if (!sound) return;

        this.queue.push(type);
        this.processQueue();
    }

    async processQueue() {
        if (this.isPlaying || this.queue.length === 0) return;

        this.isPlaying = true;
        const type = this.queue.shift();
        const audio = this.audioCache[type];

        if (audio) {
            audio.volume = this.volume;
            try {
                await audio.play();
                audio.onended = () => {
                    this.isPlaying = false;
                    this.processQueue();
                };
            } catch (e) {
                console.warn('Audio play failed', e);
                this.isPlaying = false;
                this.processQueue();
            }
        } else {
            this.isPlaying = false;
            this.processQueue();
        }
    }
}

export const soundManager = new SoundManager();
window.soundManager = soundManager;
