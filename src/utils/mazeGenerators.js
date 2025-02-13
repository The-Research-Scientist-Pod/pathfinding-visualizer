import { GRID_SETTINGS, getNeighbors } from './gridUtils';

export const MAZE_TYPES = {
    RECURSIVE_DIVISION: 'recursiveDivision',
    RECURSIVE_VERTICAL: 'recursiveVertical',
    RECURSIVE_HORIZONTAL: 'recursiveHorizontal',
    BASIC_RANDOM: 'basicRandom',
    CIRCULAR: 'circular'
};

// Core utility functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const initializeMazeGrid = grid => {
    return grid.map(row => row.map(node => ({
        ...node,
        isWall: false,
        isVisited: false,
        previousNode: null,
        isDrawing: false
    })));
};

const animateWallCreation = async (grid, row, col, setGrid) => {
    await delay(10);
    setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        if (newGrid[row]?.[col]) {
            newGrid[row][col] = {
                ...newGrid[row][col],
                isWall: true,
                isDrawing: true
            };
        }
        return newGrid;
    });
};

const clearStartFinish = grid => {
    const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
    grid[START_NODE_ROW][START_NODE_COL].isWall = false;
    grid[FINISH_NODE_ROW][FINISH_NODE_COL].isWall = false;
};

const isValidCell = (row, col) => {
    return row >= 0 && row < GRID_SETTINGS.ROWS && col >= 0 && col < GRID_SETTINGS.COLS;
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Path finding and validation
const createGuaranteedPath = grid => {
    const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
    let current = { row: START_NODE_ROW, col: START_NODE_COL };

    // Create a direct path
    while (current.row !== FINISH_NODE_ROW || current.col !== FINISH_NODE_COL) {
        if (current.row !== FINISH_NODE_ROW && Math.random() < 0.5) {
            current.row += Math.sign(FINISH_NODE_ROW - current.row);
        } else if (current.col !== FINISH_NODE_COL) {
            current.col += Math.sign(FINISH_NODE_COL - current.col);
        }
        grid[current.row][current.col].isWall = false;
    }
};

const verifyPath = grid => {
    const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
    const startNode = grid[START_NODE_ROW][START_NODE_COL];
    const endNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
    const visited = new Set();
    const queue = [startNode];

    while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.row},${current.col}`;

        if (current === endNode) return true;
        if (visited.has(key)) continue;

        visited.add(key);
        const neighbors = getNeighbors(current, grid).filter(n => !n.isWall);
        queue.push(...neighbors);
    }

    return false;
};

// Basic wall generation
const addOuterWalls = async (grid, setGrid) => {
    for (let i = 0; i < GRID_SETTINGS.COLS; i++) {
        await Promise.all([
            animateWallCreation(grid, 0, i, setGrid),
            animateWallCreation(grid, GRID_SETTINGS.ROWS - 1, i, setGrid)
        ]);
        grid[0][i].isWall = true;
        grid[GRID_SETTINGS.ROWS - 1][i].isWall = true;
    }

    for (let i = 1; i < GRID_SETTINGS.ROWS - 1; i++) {
        await Promise.all([
            animateWallCreation(grid, i, 0, setGrid),
            animateWallCreation(grid, i, GRID_SETTINGS.COLS - 1, setGrid)
        ]);
        grid[i][0].isWall = true;
        grid[i][GRID_SETTINGS.COLS - 1].isWall = true;
    }
};

const divideRecursively = async (grid, startRow, endRow, startCol, endCol, orientation, setGrid, skew = false) => {
    if (endRow - startRow < 3 || endCol - startCol < 3) return;

    const isHorizontal = orientation === 'horizontal';

    // Bias wall position towards the edges to create longer corridors
    let wallRow, wallCol;

    if (isHorizontal) {
        // For horizontal walls, prefer positions near the top or bottom
        const isTop = Math.random() < 0.5;
        wallRow = isTop
            ? startRow + 1 + Math.floor(Math.random() * 2)
            : endRow - 1 - Math.floor(Math.random() * 2);
        wallCol = startCol;
    } else {
        // For vertical walls, prefer positions near the left or right
        const isLeft = Math.random() < 0.5;
        wallCol = isLeft
            ? startCol + 1 + Math.floor(Math.random() * 2)
            : endCol - 1 - Math.floor(Math.random() * 2);
        wallRow = startRow;
    }

    // Ensure wall positions are odd to maintain grid
    if (wallRow % 2 === 0) wallRow++;
    if (wallCol % 2 === 0) wallCol++;

    // Create passages at the ends of walls to encourage snake-like paths
    const passagePos = isHorizontal
        ? (Math.random() < 0.5 ? startCol : endCol)
        : (Math.random() < 0.5 ? startRow : endRow);

    // Build walls with a single passage
    if (isHorizontal) {
        for (let col = startCol; col <= endCol; col++) {
            if (col !== passagePos && !grid[wallRow][col].isStart && !grid[wallRow][col].isFinish) {
                await animateWallCreation(grid, wallRow, col, setGrid);
                grid[wallRow][col].isWall = true;
            }
        }
    } else {
        for (let row = startRow; row <= endRow; row++) {
            if (row !== passagePos && !grid[row][wallCol].isStart && !grid[row][wallCol].isFinish) {
                await animateWallCreation(grid, row, wallCol, setGrid);
                grid[row][wallCol].isWall = true;
            }
        }
    }

    // Determine next orientation with strong bias towards maintaining direction
    const shouldMaintainOrientation = Math.random() < 0.7; // 70% chance to maintain direction
    const nextOrientation = skew
        ? (isHorizontal ? 'vertical' : 'horizontal')
        : (shouldMaintainOrientation ? orientation : (isHorizontal ? 'vertical' : 'horizontal'));

    // Recursively divide sub-sections with snake-like bias
    if (isHorizontal) {
        // Randomly choose which section to divide first
        const divideTopFirst = Math.random() < 0.5;
        if (divideTopFirst) {
            await divideRecursively(grid, startRow, wallRow - 1, startCol, endCol, nextOrientation, setGrid, skew);
            await divideRecursively(grid, wallRow + 1, endRow, startCol, endCol, nextOrientation, setGrid, skew);
        } else {
            await divideRecursively(grid, wallRow + 1, endRow, startCol, endCol, nextOrientation, setGrid, skew);
            await divideRecursively(grid, startRow, wallRow - 1, startCol, endCol, nextOrientation, setGrid, skew);
        }
    } else {
        const divideLeftFirst = Math.random() < 0.5;
        if (divideLeftFirst) {
            await divideRecursively(grid, startRow, endRow, startCol, wallCol - 1, nextOrientation, setGrid, skew);
            await divideRecursively(grid, startRow, endRow, wallCol + 1, endCol, nextOrientation, setGrid, skew);
        } else {
            await divideRecursively(grid, startRow, endRow, wallCol + 1, endCol, nextOrientation, setGrid, skew);
            await divideRecursively(grid, startRow, endRow, startCol, wallCol - 1, nextOrientation, setGrid, skew);
        }
    }
};

export const recursiveDivision = async (grid, setGrid, setIsGenerating) => {
    setIsGenerating(true);
    const newGrid = initializeMazeGrid(grid);

    await addOuterWalls(newGrid, setGrid);

    // Start with random orientation for variety
    const initialOrientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
    await divideRecursively(
        newGrid,
        1,
        GRID_SETTINGS.ROWS - 2,
        1,
        GRID_SETTINGS.COLS - 2,
        initialOrientation,
        setGrid
    );

    clearStartFinish(newGrid);
    setGrid([...newGrid]);
    setIsGenerating(false);
    return newGrid;
};

export const recursiveDivisionVertical = async (grid, setGrid, setIsGenerating) => {
    setIsGenerating(true);
    const newGrid = initializeMazeGrid(grid);

    await addOuterWalls(newGrid, setGrid);
    await divideRecursively(
        newGrid,
        1,
        GRID_SETTINGS.ROWS - 2,
        1,
        GRID_SETTINGS.COLS - 2,
        'vertical',
        setGrid,
        true
    );

    clearStartFinish(newGrid);
    setGrid([...newGrid]);
    setIsGenerating(false);
    return newGrid;
};

export const recursiveDivisionHorizontal = async (grid, setGrid, setIsGenerating) => {
    setIsGenerating(true);
    const newGrid = initializeMazeGrid(grid);

    await addOuterWalls(newGrid, setGrid);
    await divideRecursively(
        newGrid,
        1,
        GRID_SETTINGS.ROWS - 2,
        1,
        GRID_SETTINGS.COLS - 2,
        'horizontal',
        setGrid,
        true
    );

    clearStartFinish(newGrid);
    setGrid([...newGrid]);
    setIsGenerating(false);
    return newGrid;
};

export const basicRandomMaze = async (grid, setGrid, setIsGenerating) => {
    setIsGenerating(true);
    const newGrid = initializeMazeGrid(grid);

    for (let row = 0; row < GRID_SETTINGS.ROWS; row++) {
        for (let col = 0; col < GRID_SETTINGS.COLS; col++) {
            if (Math.random() < 0.3 && !grid[row][col].isStart && !grid[row][col].isFinish) {
                await animateWallCreation(newGrid, row, col, setGrid);
                newGrid[row][col].isWall = true;
            }
        }
    }

    if (!verifyPath(newGrid)) {
        createGuaranteedPath(newGrid);
    }

    clearStartFinish(newGrid);
    setGrid([...newGrid]);
    setIsGenerating(false);
    return newGrid;
};

export const circularMaze = async (grid, setGrid, setIsGenerating) => {
    setIsGenerating(true);
    const newGrid = initializeMazeGrid(grid);
    const centerRow = Math.floor(GRID_SETTINGS.ROWS / 2);
    const centerCol = Math.floor(GRID_SETTINGS.COLS / 2);
    const maxRadius = Math.min(centerRow, centerCol) - 1;

    for (let radius = 2; radius <= maxRadius; radius += 2) {
        const angleStep = 0.1;
        const points = new Set();

        // Draw circle
        for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
            const row = Math.round(centerRow + radius * Math.cos(angle));
            const col = Math.round(centerCol + radius * Math.sin(angle));
            const key = `${row},${col}`;

            if (!points.has(key) && isValidCell(row, col) &&
                !grid[row][col].isStart && !grid[row][col].isFinish) {
                points.add(key);
                await animateWallCreation(newGrid, row, col, setGrid);
                newGrid[row][col].isWall = true;
            }
        }

        // Create passages
        const numPassages = Math.max(2, Math.floor(radius));
        for (let i = 0; i < numPassages; i++) {
            const angle = (2 * Math.PI * i) / numPassages;
            const row = Math.round(centerRow + radius * Math.cos(angle));
            const col = Math.round(centerCol + radius * Math.sin(angle));

            if (isValidCell(row, col)) {
                newGrid[row][col].isWall = false;
                setGrid([...newGrid]);
            }
        }
    }

    if (!verifyPath(newGrid)) {
        createGuaranteedPath(newGrid);
    }

    clearStartFinish(newGrid);
    setGrid([...newGrid]);
    setIsGenerating(false);
    return newGrid;
};