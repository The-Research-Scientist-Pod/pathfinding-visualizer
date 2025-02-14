import React, { useEffect, useState, useCallback } from 'react';
import { GRID_SETTINGS } from '../utils/gridUtils';

const Grid = ({ grid, onMouseDown, onMouseEnter, onMouseUp, isLandscape }) => {
    const [cellSize, setCellSize] = useState(25);
    const [touchStarted, setTouchStarted] = useState(false);

    const calculateCellSize = useCallback(() => {
        // Adjust these values based on your header and padding sizes
        const headerHeight = 220; // Increased to account for all UI elements
        const padding = 32; // Consistent padding

        // Get available space
        const availableWidth = Math.min(window.innerWidth - padding * 2, 1200); // Max width cap
        const availableHeight = window.innerHeight - headerHeight;

        // Calculate cell size based on grid dimensions
        const cellByWidth = (availableWidth - padding) / GRID_SETTINGS.COLS;
        const cellByHeight = (availableHeight - padding) / GRID_SETTINGS.ROWS;

        // Use the smaller value to ensure entire grid fits
        const size = Math.floor(Math.min(cellByWidth, cellByHeight));

        // Clamp the size between minimum and maximum values
        return Math.max(10, Math.min(size, 30)); // Adjusted min/max sizes
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setCellSize(calculateCellSize());
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [calculateCellSize]);

    // Touch event handlers
    const handleTouchStart = (rowIdx, nodeIdx, e) => {
        e.preventDefault();
        setTouchStarted(true);
        onMouseDown(rowIdx, nodeIdx);
    };

    const handleTouchMove = (rowIdx, nodeIdx, e) => {
        e.preventDefault();
        if (touchStarted) {
            onMouseEnter(rowIdx, nodeIdx);
        }
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        setTouchStarted(false);
        onMouseUp();
    };

    const getNodeClassName = (node) => {
        const baseClasses = "transition-colors duration-200";

        if (node.isFinish) return `${baseClasses} bg-red-500`;
        if (node.isStart) return `${baseClasses} bg-green-500`;
        if (node.isWall) return `${baseClasses} bg-gray-900`;
        if (node.isPath) return `${baseClasses} bg-yellow-400`;
        if (node.isVisited) return `${baseClasses} bg-blue-400`;

        return `${baseClasses} bg-white hover:bg-gray-100`;
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SETTINGS.COLS}, ${cellSize}px)`,
        gap: '1px',
        padding: '4px',
        backgroundColor: '#e5e7eb',
        margin: '0 auto',
        border: '2px solid #d1d5db',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: 'min-content', // Ensures grid doesn't shrink below content size
    };

    return (
        <div className="w-full overflow-auto flex justify-center items-center p-2">
            <div style={gridStyle}>
                {grid.map((row, rowIdx) =>
                    row.map((node, nodeIdx) => (
                        <div
                            key={`${rowIdx}-${nodeIdx}`}
                            className={getNodeClassName(node)}
                            style={{
                                width: `${cellSize}px`,
                                height: `${cellSize}px`,
                                touchAction: 'none',
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