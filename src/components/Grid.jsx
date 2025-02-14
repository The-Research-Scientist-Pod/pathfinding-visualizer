import React, { useEffect, useState, useCallback } from 'react';
import { GRID_SETTINGS } from '../utils/gridUtils';

const Grid = ({ grid, onMouseDown, onMouseEnter, onMouseUp, isLandscape }) => {
    const [cellSize, setCellSize] = useState(25);
    const [touchStarted, setTouchStarted] = useState(false);

    const calculateCellSize = useCallback(() => {
        // Get viewport dimensions
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

        // Much larger margins and header space for mobile
        const headerHeight = isLandscape ? 180 : 280; // Increased header space
        const SIDE_MARGIN = isLandscape ? 40 : 32;

        // Calculate available space with larger margins
        const availableWidth = vw - (SIDE_MARGIN * 2);
        const availableHeight = vh - headerHeight - (SIDE_MARGIN * 2);

        // Calculate cell size ensuring grid fits in available space
        const widthBasedSize = (availableWidth * 0.95) / GRID_SETTINGS.COLS; // 95% of available width
        const heightBasedSize = (availableHeight * 0.95) / GRID_SETTINGS.ROWS; // 95% of available height

        // Use the smaller value and enforce size limits
        let size = Math.min(widthBasedSize, heightBasedSize);

        // Stricter size limits for mobile
        const maxSize = isLandscape ? 20 : 12;
        const minSize = isLandscape ? 10 : 6;

        return Math.floor(Math.max(minSize, Math.min(size, maxSize)));
    }, [isLandscape]);

    useEffect(() => {
        const handleResize = () => {
            requestAnimationFrame(() => {
                setCellSize(calculateCellSize());
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 100);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [calculateCellSize]);

    const getNodeClassName = (node) => {
        const baseClasses = "transition-colors duration-200";

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
        <div className="w-full flex justify-center items-center px-5 py-5">
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SETTINGS.COLS}, ${cellSize}px)`,
                    gap: '1px',
                    padding: '4px',
                    backgroundColor: '#e5e7eb',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    userSelect: 'none',
                }}
                className="shadow-lg"
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