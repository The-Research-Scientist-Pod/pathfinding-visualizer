import React, { useEffect } from 'react';
import AppWrapper from './components/AppWrapper';
import audioService from './utils/AudioService';

function App() {
    // Initialize audio context on first user interaction
    useEffect(() => {
        const handleFirstInteraction = () => {
            // Try to resume AudioContext (browsers may suspend it initially)
            if (audioService.audioContext?.state === 'suspended') {
                audioService.audioContext.resume();
            }

            // Remove event listeners once audio is initialized
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 max-w-[100vw] overflow-x-hidden">
            <AppWrapper />
        </div>
    );
}

export default App;