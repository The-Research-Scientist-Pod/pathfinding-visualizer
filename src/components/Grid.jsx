// Grid.jsx
import React, { useEffect, useState } from 'react';
import { GRID_SETTINGS } from '../utils/gridUtils';
import './Grid.css';

const Grid = ({ grid, onMouseDown, onMouseEnter, onMouseUp }) => {
    const [cellSize, setCellSize] = useState(25);

    const calculateCellSize = () => {
        const padding = 48; // Account for grid container padding and border
        const minCellSize = 15;
        const maxCellSize = 35;

        const availableWidth = Math.min(window.innerWidth - padding * 2, 1200);
        const availableHeight = window.innerHeight - 250;

        const cellByWidth = Math.floor((availableWidth - padding) / GRID_SETTINGS.COLS);
        const cellByHeight = Math.floor((availableHeight - padding) / GRID_SETTINGS.ROWS);

        return Math.min(
            Math.max(minCellSize, Math.min(cellByWidth, cellByHeight)),
            maxCellSize
        );
    };

    useEffect(() => {
        const handleResize = () => {
            setCellSize(calculateCellSize());
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const getNodeClassName = (node) => {
        const baseClass = 'node';
        if (node.isFinish) return `${baseClass} node-finish`;
        if (node.isStart) return `${baseClass} node-start`;
        if (node.isWall) return `${baseClass} node-wall`;
        if (node.isPath) return `${baseClass} node-shortest-path`;
        if (node.isVisited) return `${baseClass} node-visited`;
        return baseClass;
    };

    return (
        <div
            className="grid bg-gray-200 rounded-lg shadow-lg border-2 border-gray-300"
            style={{
                display: 'inline-grid',
                gridTemplateColumns: `repeat(${GRID_SETTINGS.COLS}, ${cellSize}px)`,
                gap: '1px',
                padding: '8px',
                backgroundColor: '#e5e7eb',
                margin: '0 auto',
            }}
        >
            {grid.map((row, rowIdx) =>
                row.map((node, nodeIdx) => (
                    <div
                        key={`${rowIdx}-${nodeIdx}`}
                        className={getNodeClassName(node)}
                        style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`
                        }}
                        onMouseDown={() => onMouseDown(rowIdx, nodeIdx)}
                        onMouseEnter={() => onMouseEnter(rowIdx, nodeIdx)}
                        onMouseUp={onMouseUp}
                    />
                ))
            )}
        </div>
    );
};

export default Grid;