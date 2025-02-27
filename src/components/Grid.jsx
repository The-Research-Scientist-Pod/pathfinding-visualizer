import React, { useEffect, useState, useCallback } from 'react';
import { GRID_SETTINGS } from '../utils/gridUtils';
import { useWindowSize } from '../hooks/useWindowSize'; // Import the custom hook

const Grid = ({ grid, onMouseDown, onMouseEnter, onMouseUp, isLandscape }) => {
    const [cellSize, setCellSize] = useState(8); // Start with a smaller default
    const [touchStarted, setTouchStarted] = useState(false);
    const windowSize = useWindowSize(); // Use the window size hook

    const calculateCellSize = useCallback(() => {
        // Get viewport dimensions
        const vw = windowSize.width || document.documentElement.clientWidth || 0;
        const vh = windowSize.height || document.documentElement.clientHeight || 0;

        // Dynamic header height based on screen size and content
        const headerHeight = isLandscape ? 220 : 320;

        // Use smaller margins on small screens
        const sideMargin = Math.min(20, Math.max(8, vw * 0.02));

        // Calculate available space
        const availableWidth = vw - (sideMargin * 2);
        // In landscape, account for two grids side by side with gap
        const effectiveWidth = isLandscape ? (availableWidth * 0.47) : availableWidth;
        const availableHeight = vh - headerHeight - (sideMargin * 2);

        // Calculate cell size ensuring grid fits in available space
        const widthBasedSize = (effectiveWidth * 0.95) / GRID_SETTINGS.COLS;
        const heightBasedSize = (availableHeight * 0.92) / GRID_SETTINGS.ROWS;

        // Use the smaller value to ensure the grid fits
        let size = Math.min(widthBasedSize, heightBasedSize);

        // Much stricter max size limit to prevent cells from growing too large on bigger screens
        // This will help prevent grid overlap issues
        const maxSize = Math.min(12, Math.max(8, vw * 0.008));

        // Smaller min size for small screens
        const minSize = vw < 640 ? 3 : (isLandscape ? 4 : 3);

        // Round down to avoid overflow
        return Math.floor(Math.max(minSize, Math.min(size, maxSize)));
    }, [isLandscape, windowSize]);

    useEffect(() => {
        // Update cell size when window size or orientation changes
        const handleResize = () => {
            requestAnimationFrame(() => {
                setCellSize(calculateCellSize());
            });
        };

        handleResize();

        // We're already handling resize through the hook, but keep this for immediate updates
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [calculateCellSize, windowSize]);

    const getNodeClassName = (node) => {
        const baseClasses = "transition-colors duration-100"; // Faster transition

        if (node.isFinish) return `${baseClasses} bg-red-500`;
        if (node.isStart) return `${baseClasses} bg-green-500`;
        if (node.isWall) return `${baseClasses} bg-gray-900`;
        if (node.isPath) return `${baseClasses} bg-yellow-400`;
        if (node.isVisited) return `${baseClasses} bg-blue-400`;

        return `${baseClasses} bg-white hover:bg-gray-100`;
    };

    const handleTouchStart = (rowIdx, nodeIdx, e) => {
        e.preventDefault();
        setTouchStarted(true);
        onMouseDown(rowIdx, nodeIdx);
    };

    const handleTouchMove = (rowIdx, nodeIdx, e) => {
        e.preventDefault();
        if (touchStarted) {
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element) {
                const cellCoords = element.getAttribute('data-cell');
                if (cellCoords) {
                    const [row, col] = cellCoords.split('-').map(Number);
                    onMouseEnter(row, col);
                }
            }
        }
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        setTouchStarted(false);
        onMouseUp();
    };

    return (
        <div className="w-full flex justify-center items-center p-1">
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SETTINGS.COLS}, ${cellSize}px)`,
                    gap: '1px',
                    padding: '2px',
                    backgroundColor: '#e5e7eb',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    userSelect: 'none',
                }}
                className="shadow-md"
            >
                {grid.map((row, rowIdx) =>
                    row.map((node, nodeIdx) => (
                        <div
                            key={`${rowIdx}-${nodeIdx}`}
                            data-cell={`${rowIdx}-${nodeIdx}`}
                            className={getNodeClassName(node)}
                            style={{
                                width: `${cellSize}px`,
                                height: `${cellSize}px`,
                            }}
                            onMouseDown={() => onMouseDown(rowIdx, nodeIdx)}
                            onMouseEnter={() => onMouseEnter(rowIdx, nodeIdx)}
                            onMouseUp={onMouseUp}
                            onTouchStart={(e) => handleTouchStart(rowIdx, nodeIdx, e)}
                            onTouchMove={(e) => handleTouchMove(rowIdx, nodeIdx, e)}
                            onTouchEnd={handleTouchEnd}
                            role="presentation"
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Grid;