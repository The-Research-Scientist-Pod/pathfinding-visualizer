// src/utils/AudioService.js

class AudioService {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isEnabled = true;
        this.masterVolume = 0.5; // 0-1 scale
        this.initialized = false;

        // Try to load audio context on instantiation
        this.init();
    }

    init() {
        try {
            // Create audio context
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Create master volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.masterVolume;
            this.masterGainNode.connect(this.audioContext.destination);

            this.initialized = true;

            // Load sounds
            this.loadSounds();

            console.log('Audio service initialized');
        } catch (e) {
            console.warn('Web Audio API is not supported in this browser', e);
        }
    }

    loadSounds() {
        // Define sounds with their configurations
        const soundDefinitions = {
            // UI sounds
            click: { url: '/sounds/click.mp3', volume: 0.4 },
            switch: { url: '/sounds/switch.mp3', volume: 0.4 },
            reset: { url: '/sounds/reset.mp3', volume: 0.4 },

            // Algorithm sounds
            nodeVisit: { url: '/sounds/node_visit.mp3', volume: 0.2 },
            pathNode: { url: '/sounds/path_node.mp3', volume: 0.3 },

            // Completion sounds
            success: { url: '/sounds/success.mp3', volume: 0.6 },
            failure: { url: '/sounds/failure.mp3', volume: 0.6 },

            // Competition specific
            winLeft: { url: '/sounds/win_left.mp3', volume: 0.7 },
            winRight: { url: '/sounds/win_right.mp3', volume: 0.7 },
            tie: { url: '/sounds/tie.mp3', volume: 0.7 },

            // Wall interactions
            wallAdd: { url: '/sounds/wall_add.mp3', volume: 0.3 },
            wallRemove: { url: '/sounds/wall_remove.mp3', volume: 0.3 },
        };

        // For development, create oscillator-based sounds if audio files don't exist
        // This way the feature still works without requiring sound files
        Object.keys(soundDefinitions).forEach(soundId => {
            this.createOscillatorSound(soundId, soundDefinitions[soundId]);
        });
    }

    createOscillatorSound(soundId, config) {
        // Store information about how to create this sound
        // We'll generate it on demand rather than keeping oscillators around
        this.sounds[soundId] = {
            soundType: 'oscillator',
            ...this.getOscillatorSettingsForSound(soundId),
            volume: config.volume || 0.5
        };
    }

    getOscillatorSettingsForSound(soundId) {
        // Different sounds have different characteristics
        const soundMap = {
            // UI sounds
            click: { frequency: 800, oscillatorType: 'sine', duration: 0.05 },
            switch: { frequency: 600, oscillatorType: 'sine', duration: 0.1 },
            reset: { frequency: 300, oscillatorType: 'square', duration: 0.15 },

            // Algorithm sounds
            nodeVisit: { frequency: 440, oscillatorType: 'sine', duration: 0.05 },
            pathNode: { frequency: 660, oscillatorType: 'sine', duration: 0.08 },

            // Completion sounds
            success: { frequency: 800, oscillatorType: 'sine', duration: 0.3, steps: [0, 4, 7] }, // Major chord
            failure: { frequency: 400, oscillatorType: 'sine', duration: 0.3, steps: [0, 3, 6] }, // Minor chord

            // Competition specific
            winLeft: { frequency: 500, oscillatorType: 'sine', duration: 0.4, steps: [0, 4, 7, 12] }, // Major 7th
            winRight: { frequency: 550, oscillatorType: 'sine', duration: 0.4, steps: [0, 4, 7, 12] }, // Major 7th higher
            tie: { frequency: 450, oscillatorType: 'sine', duration: 0.4, steps: [0, 5, 9] }, // Suspended chord

            // Wall interactions
            wallAdd: { frequency: 200, oscillatorType: 'square', duration: 0.05 },
            wallRemove: { frequency: 150, oscillatorType: 'square', duration: 0.05 },
        };

        return soundMap[soundId] || { frequency: 440, oscillatorType: 'sine', duration: 0.1 };
    }

    // Play a sound by its ID
    play(soundId) {
        if (!this.initialized || !this.isEnabled) return;

        // Resume audio context if it's suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const sound = this.sounds[soundId];
        if (!sound) {
            console.warn(`Sound not found: ${soundId}`);
            return;
        }

        // Handle oscillator-based sounds
        if (sound.soundType === 'oscillator') {
            this.playOscillator(sound, soundId);
        }
    }

    playOscillator(sound, soundId) {
        const { frequency, oscillatorType, duration, steps } = sound;

        // Create a gain node for this sound
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = sound.volume * this.masterVolume;
        gainNode.connect(this.masterGainNode);

        if (steps) {
            // Play a chord or arpeggio if steps are defined
            steps.forEach((step, index) => {
                setTimeout(() => {
                    // Create the note using the frequency and step
                    const noteFreq = frequency * Math.pow(2, step / 12);
                    const oscillator = this.audioContext.createOscillator();
                    oscillator.type = oscillatorType || 'sine';
                    oscillator.frequency.value = noteFreq;

                    oscillator.connect(gainNode);

                    // Start the oscillator
                    oscillator.start();

                    // Set envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(sound.volume * this.masterVolume, now + 0.01);
                    gainNode.gain.linearRampToValueAtTime(0, now + duration);

                    // Stop the oscillator
                    setTimeout(() => {
                        oscillator.stop();
                        oscillator.disconnect();
                    }, duration * 1000);
                }, index * 60); // Slight delay between notes
            });
        } else {
            // Play a single note
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = oscillatorType;
            oscillator.frequency.value = frequency;

            oscillator.connect(gainNode);

            // Start the oscillator
            oscillator.start();

            // Set envelope
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(sound.volume * this.masterVolume, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            // Stop the oscillator
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
            }, duration * 1000);
        }
    }

    // Utility methods for controlling audio
    enable() {
        this.isEnabled = true;
        if (!this.initialized) {
            this.init();
        }
    }

    disable() {
        this.isEnabled = false;
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }
    }

    // Special sound functions for algorithm animation
    playVisitSound(row, col, gridWidth, side = 'center') {
        if (!this.isEnabled) return;

        // Change pitch based on position in grid to create a musical pattern
        // This creates a more pleasing sound than just the same note over and over
        const note = row % 12; // 12 notes in an octave
        const octaveOffset = Math.floor(col / gridWidth * 3); // 0-2 octave shift based on horizontal position

        // Adjust base frequency based on side (left grid slightly lower, right grid slightly higher)
        let baseFreq = 220; // A3
        if (side === 'left') baseFreq = 200;
        if (side === 'right') baseFreq = 240;

        const noteFreq = baseFreq * Math.pow(2, (note + octaveOffset * 12) / 12);

        // Create a temporary custom sound
        const tempSound = {
            soundType: 'oscillator',
            frequency: noteFreq,
            oscillatorType: 'sine',
            duration: 0.03,
            volume: 0.15
        };

        this.playOscillator(tempSound);
    }

    playPathSound(index, pathLength, side = 'center') {
        if (!this.isEnabled) return;

        // Create an ascending scale as the path is drawn
        const progress = index / pathLength;
        const note = Math.floor(progress * 12); // 12 notes in an octave

        // Adjust base frequency based on side (left grid slightly lower, right grid slightly higher)
        let baseFreq = 440; // A4
        if (side === 'left') baseFreq = 400;
        if (side === 'right') baseFreq = 480;

        const noteFreq = baseFreq * Math.pow(2, note / 12);

        // Create a temporary custom sound
        const tempSound = {
            soundType: 'oscillator',
            frequency: noteFreq,
            oscillatorType: 'sine',
            duration: 0.08,
            volume: 0.2
        };

        this.playOscillator(tempSound);
    }
}

// Create a singleton instance
const audioService = new AudioService();

// Export as default
export default audioService;