import { GRID_SETTINGS } from './gridUtils';

export const MAZE_TYPES = {
    BACKTRACKING: 'backtracking'
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const initializeMazeGrid = grid => {
    return grid.map(row => row.map(node => ({
        ...node,
        isWall: true,
        isVisited: false,
        previousNode: null,
        isDrawing: false,
        isPath: false
    })));
};

// Batch updates for better performance
const batchAnimateCells = async (cells, setGrid) => {
    setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        cells.forEach(({row, col}) => {
            if (newGrid[row]?.[col]) {
                newGrid[row][col] = {
                    ...newGrid[row][col],
                    isWall: false,
                    isPath: true,
                    isDrawing: true
                };
            }
        });
        return newGrid;
    });
    await delay(1); // Minimal delay for visual feedback
};

const getUnvisitedNeighbors = (row, col, grid) => {
    const neighbors = [];
    const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];

    for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (
            newRow >= 0 && newRow < GRID_SETTINGS.ROWS &&
            newCol >= 0 && newCol < GRID_SETTINGS.COLS &&
            grid[newRow][newCol].isWall
        ) {
            neighbors.push({ row: newRow, col: newCol });
        }
    }

    // Fisher-Yates shuffle for better randomization performance
    for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }

    return neighbors;
};

const generateMazeRecursive = async (grid, row, col, setGrid) => {
    const cellsToAnimate = [];
    cellsToAnimate.push({ row, col });

    const neighbors = getUnvisitedNeighbors(row, col, grid);
    for (const neighbor of neighbors) {
        if (grid[neighbor.row][neighbor.col].isWall) {
            const wallRow = (row + neighbor.row) / 2;
            const wallCol = (col + neighbor.col) / 2;

            grid[neighbor.row][neighbor.col].isWall = false;
            grid[wallRow][wallCol].isWall = false;

            cellsToAnimate.push(
                { row: wallRow, col: wallCol },
                { row: neighbor.row, col: neighbor.col }
            );

            await batchAnimateCells(cellsToAnimate, setGrid);
            cellsToAnimate.length = 0;  // Clear the array for next batch

            await generateMazeRecursive(grid, neighbor.row, neighbor.col, setGrid);
        }
    }

    // Clear path marking for cells we're done with
    setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        cellsToAnimate.forEach(({row, col}) => {
            if (newGrid[row]?.[col]) {
                newGrid[row][col] = {
                    ...newGrid[row][col],
                    isPath: false
                };
            }
        });
        return newGrid;
    });
};

export const backtrackingMaze = async (grid, setGrid, setIsGenerating) => {
    setIsGenerating(true);

    try {
        const newGrid = initializeMazeGrid(grid);
        const startRow = 1;
        const startCol = 1;

        // Generate maze with batched updates
        await generateMazeRecursive(newGrid, startRow, startCol, setGrid);

        // Clear start and end positions
        const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        newGrid[START_NODE_ROW][START_NODE_COL].isWall = false;
        newGrid[FINISH_NODE_ROW][FINISH_NODE_COL].isWall = false;

        setGrid([...newGrid]);
    } catch (error) {
        console.error('Maze generation error:', error);
    } finally {
        setIsGenerating(false);
    }
};