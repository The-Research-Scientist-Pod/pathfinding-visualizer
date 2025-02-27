// Add this to a new file: hooks/useWindowSize.js
import { useState, useEffect } from 'react';

export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });

    useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
            // Set window size with a slight delay to ensure accurate values after orientation changes
            setTimeout(() => {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }, 100);
        }

        // Add event listener
        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []); // Empty array ensures effect is only run on mount and unmount

    return windowSize;
}