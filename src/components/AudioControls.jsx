import React, { useState, useEffect } from 'react';
import audioService from '../utils/AudioService';

const AudioControls = () => {
    const [isEnabled, setIsEnabled] = useState(true);
    const [volume, setVolume] = useState(0.5);

    useEffect(() => {
        // Initialize states from audio service
        setIsEnabled(audioService.isEnabled);
        setVolume(audioService.masterVolume);
    }, []);

    const toggleSound = () => {
        const newState = !isEnabled;
        setIsEnabled(newState);

        // Update audio service
        if (newState) {
            audioService.enable();
            // Play a test sound to initialize audio context (browser autoplay policy)
            audioService.play('switch');
        } else {
            audioService.disable();
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        audioService.setVolume(newVolume);

        // Provide audio feedback for volume change
        if (isEnabled && newVolume > 0) {
            audioService.play('click');
        }
    };

    return (
        <div className="flex items-center gap-3 px-3 py-1 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleSound}
                    className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isEnabled ? 'text-blue-600' : 'text-gray-400'
                    }`}
                    title={isEnabled ? 'Mute sound' : 'Enable sound'}
                >
                    {isEnabled ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                <span className="text-xs text-gray-600">Sound</span>
            </div>

            {isEnabled && (
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={!isEnabled}
                    />
                    <span className="text-xs text-gray-600">{Math.round(volume * 100)}%</span>
                </div>
            )}
        </div>
    );
};

export default AudioControls;