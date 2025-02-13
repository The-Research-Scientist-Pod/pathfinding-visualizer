// gridUtils.js

export const GRID_SETTINGS = {
    ROWS: 20,
    COLS: 30,
    START_NODE_ROW: 10,
    START_NODE_COL: 5,
    FINISH_NODE_ROW: 10,
    FINISH_NODE_COL: 25,
};

// Validate coordinates are within grid bounds
const isValidPosition = (row, col) => {
    return (
        row >= 0 &&
        row < GRID_SETTINGS.ROWS &&
        col >= 0 &&
        col < GRID_SETTINGS.COLS
    );
};

export const createNode = (row, col) => {
    if (!isValidPosition(row, col)) {
        throw new Error(`Invalid position: row=${row}, col=${col}`);
    }

    return {
        row,
        col,
        isStart: row === GRID_SETTINGS.START_NODE_ROW && col === GRID_SETTINGS.START_NODE_COL,
        isFinish: row === GRID_SETTINGS.FINISH_NODE_ROW && col === GRID_SETTINGS.FINISH_NODE_COL,
        distance: Infinity,
        isVisited: false,
        isWall: false,
        previousNode: null,
        isPath: false,
        f: Infinity,
        g: Infinity,
        h: Infinity,
    };
};

export const getInitialGrid = () => {
    const grid = [];
    for (let row = 0; row < GRID_SETTINGS.ROWS; row++) {
        const currentRow = [];
        for (let col = 0; col < GRID_SETTINGS.COLS; col++) {
            currentRow.push(createNode(row, col));
        }
        grid.push(currentRow);
    }
    return grid;
};

export const getNewGridWithWallToggled = (grid, row, col) => {
    if (!grid || !Array.isArray(grid) || !Array.isArray(grid[0])) {
        throw new Error('Invalid grid structure');
    }

    if (!isValidPosition(row, col)) {
        throw new Error(`Invalid position: row=${row}, col=${col}`);
    }

    const newGrid = grid.map(row => [...row]);
    const node = newGrid[row][col];

    if (!node.isStart && !node.isFinish) {
        newGrid[row][col] = {
            ...node,
            isWall: !node.isWall,
        };
    }

    return newGrid;
};

export const getNeighbors = (node, grid) => {
    if (!grid || !Array.isArray(grid) || !Array.isArray(grid[0])) {
        throw new Error('Invalid grid structure');
    }

    if (!node || typeof node.row !== 'number' || typeof node.col !== 'number') {
        throw new Error('Invalid node structure');
    }

    const neighbors = [];
    const { row, col } = node;
    const directions = [
        [-1, 0],  // up
        [1, 0],   // down
        [0, -1],  // left
        [0, 1],   // right
    ];

    for (const [rowOffset, colOffset] of directions) {
        const newRow = row + rowOffset;
        const newCol = col + colOffset;

        if (isValidPosition(newRow, newCol)) {
            neighbors.push(grid[newRow][newCol]);
        }
    }

    return neighbors;
};

export const getNodesInShortestPath = (finishNode) => {
    if (!finishNode) {
        return [];
    }

    const nodesInShortestPath = [];
    let currentNode = finishNode;

    while (currentNode !== null) {
        nodesInShortestPath.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }

    return nodesInShortestPath;
};

// Additional utility functions
export const isStartNode = (row, col) => {
    return row === GRID_SETTINGS.START_NODE_ROW && col === GRID_SETTINGS.START_NODE_COL;
};

export const isFinishNode = (row, col) => {
    return row === GRID_SETTINGS.FINISH_NODE_ROW && col === GRID_SETTINGS.FINISH_NODE_COL;
};

export const clearNodeState = (node) => {
    return {
        ...node,
        distance: Infinity,
        isVisited: false,
        isPath: false,
        previousNode: null,
        f: Infinity,
        g: Infinity,
        h: Infinity,
    };
};

export const cloneGrid = (grid) => {
    if (!grid || !Array.isArray(grid) || !Array.isArray(grid[0])) {
        throw new Error('Invalid grid structure');
    }
    return grid.map(row => row.map(node => ({ ...node })));
};

// Helper function to validate grid structure
export const validateGrid = (grid) => {
    if (!grid || !Array.isArray(grid) || !Array.isArray(grid[0])) {
        throw new Error('Invalid grid structure');
    }

    if (grid.length !== GRID_SETTINGS.ROWS || grid[0].length !== GRID_SETTINGS.COLS) {
        throw new Error(`Invalid grid dimensions: expected ${GRID_SETTINGS.ROWS}x${GRID_SETTINGS.COLS}, got ${grid.length}x${grid[0].length}`);
    }

    return true;
};