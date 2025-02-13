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
    
    // Start from the outer edges and work inward
    const layers = Math.min(
        Math.floor(GRID_SETTINGS.ROWS / 2),
        Math.floor(GRID_SETTINGS.COLS / 2)
    ) - 1;

    // Create outer border
    await addOuterWalls(newGrid, setGrid);

    for (let layer = 0; layer < layers; layer++) {
        // Define the boundaries for this layer
        const startRow = layer + 1;
        const endRow = GRID_SETTINGS.ROWS - layer - 2;
        const startCol = layer + 1;
        const endCol = GRID_SETTINGS.COLS - layer - 2;

        // Create walls for this layer with a snake-like pattern
        if (layer % 2 === 0) {
            // Create horizontal walls
            for (let col = startCol; col <= endCol; col++) {
                if (!newGrid[startRow][col].isStart && !newGrid[startRow][col].isFinish) {
                    await animateWallCreation(newGrid, startRow, col, setGrid);
                    newGrid[startRow][col].isWall = true;
                }
                if (!newGrid[endRow][col].isStart && !newGrid[endRow][col].isFinish) {
                    await animateWallCreation(newGrid, endRow, col, setGrid);
                    newGrid[endRow][col].isWall = true;
                }
            }
            // Create vertical walls
            for (let row = startRow; row <= endRow; row++) {
                if (!newGrid[row][startCol].isStart && !newGrid[row][startCol].isFinish) {
                    await animateWallCreation(newGrid, row, startCol, setGrid);
                    newGrid[row][startCol].isWall = true;
                }
                if (!newGrid[row][endCol].isStart && !newGrid[row][endCol].isFinish) {
                    await animateWallCreation(newGrid, row, endCol, setGrid);
                    newGrid[row][endCol].isWall = true;
                }
            }

            // Create internal walls for additional complexity
            if (endRow - startRow > 3 && endCol - startCol > 3) {
                const midRow = Math.floor((startRow + endRow) / 2);
                const midCol = Math.floor((startCol + endCol) / 2);
                
                // Add some internal walls in a cross pattern
                for (let i = startCol + 1; i < endCol; i += 2) {
                    if (!newGrid[midRow][i].isStart && !newGrid[midRow][i].isFinish 
                        && Math.random() < 0.7) {
                        await animateWallCreation(newGrid, midRow, i, setGrid);
                        newGrid[midRow][i].isWall = true;
                    }
                }
                
                for (let i = startRow + 1; i < endRow; i += 2) {
                    if (!newGrid[i][midCol].isStart && !newGrid[i][midCol].isFinish 
                        && Math.random() < 0.7) {
                        await animateWallCreation(newGrid, i, midCol, setGrid);
                        newGrid[i][midCol].isWall = true;
                    }
                }
            }

            // Create strategic passages (fewer than before)
            const passages = [];
            
            // Add one passage per wall, but with strategic positioning
            if (Math.random() < 0.8) { // 80% chance for top wall passage
                passages.push({ 
                    row: startRow, 
                    col: startCol + Math.floor((endCol - startCol) * (Math.random() < 0.5 ? 0.25 : 0.75))
                });
            }
            if (Math.random() < 0.8) { // 80% chance for bottom wall passage
                passages.push({ 
                    row: endRow, 
                    col: startCol + Math.floor((endCol - startCol) * (Math.random() < 0.5 ? 0.25 : 0.75))
                });
            }
            if (Math.random() < 0.8) { // 80% chance for left wall passage
                passages.push({ 
                    row: startRow + Math.floor((endRow - startRow) * (Math.random() < 0.5 ? 0.25 : 0.75)),
                    col: startCol 
                });
            }
            if (Math.random() < 0.8) { // 80% chance for right wall passage
                passages.push({ 
                    row: startRow + Math.floor((endRow - startRow) * (Math.random() < 0.5 ? 0.25 : 0.75)),
                    col: endCol 
                });
            }

            // Ensure at least one passage exists
            if (passages.length === 0) {
                const wall = Math.floor(Math.random() * 4);
                switch(wall) {
                    case 0:
                        passages.push({ row: startRow, col: startCol + Math.floor((endCol - startCol) / 2) });
                        break;
                    case 1:
                        passages.push({ row: endRow, col: startCol + Math.floor((endCol - startCol) / 2) });
                        break;
                    case 2:
                        passages.push({ row: startRow + Math.floor((endRow - startRow) / 2), col: startCol });
                        break;
                    case 3:
                        passages.push({ row: startRow + Math.floor((endRow - startRow) / 2), col: endCol });
                        break;
                }
            }

            // Create the passages
            passages.forEach(passage => {
                newGrid[passage.row][passage.col].isWall = false;
                setGrid([...newGrid]);
            });
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
