// Grid.jsx
import React from 'react';
import { GRID_SETTINGS } from '../utils/gridUtils';
import './Grid.css';

const Grid = ({ grid, onMouseDown, onMouseEnter, onMouseUp }) => {
    const getNodeClassName = (node) => {
        const baseClass = 'node';
        if (node.isFinish) return `${baseClass} node-finish`;
        if (node.isStart) return `${baseClass} node-start`;
        if (node.isWall) return `${baseClass} node-wall`;
        if (node.isPath) return `${baseClass} node-path`;
        if (node.isVisited) return `${baseClass} node-visited`;
        return baseClass;
    };

    // Add a check to ensure grid is an array
    if (!Array.isArray(grid)) {
        console.error('Grid prop is not an array:', grid);
        return null;
    }

    return (
        <div
            className="grid bg-gray-200 p-4 rounded shadow-lg border-2 border-gray-300"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SETTINGS.COLS}, 30px)`,
                gap: '1px',
                backgroundColor: '#e5e7eb',
                padding: '8px',
                margin: '0 auto'
            }}
        >
            {grid.map((row, rowIdx) =>
                row.map((node, nodeIdx) => (
                    <div
                        key={`${rowIdx}-${nodeIdx}`}
                        className={getNodeClassName(node)}
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