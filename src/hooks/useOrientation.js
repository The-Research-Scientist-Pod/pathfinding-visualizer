import { useState, useEffect } from 'react';

const useOrientation = () => {
    const [orientation, setOrientation] = useState({
        type: window.screen.orientation.type,
        angle: window.screen.orientation.angle
    });

    useEffect(() => {
        const handleChange = () => {
            setOrientation({
                type: window.screen.orientation.type,
                angle: window.screen.orientation.angle
            });
        };

        window.addEventListener('orientationchange', handleChange);
        // Also listen for resize as a fallback
        window.addEventListener('resize', handleChange);

        return () => {
            window.removeEventListener('orientationchange', handleChange);
            window.removeEventListener('resize', handleChange);
        };
    }, []);

    return {
        isPortrait: orientation.type.includes('portrait'),
        isLandscape: orientation.type.includes('landscape'),
        orientation: orientation.type,
        angle: orientation.angle
    };
};

export default useOrientation;