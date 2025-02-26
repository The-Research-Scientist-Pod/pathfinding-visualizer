import { GRID_SETTINGS } from './gridUtils';
import audioService from './AudioService';

export const MAZE_TYPES = {
    BACKTRACKING: 'backtracking',
    PRIMS: 'prims',
    DIVISION: 'division',
    SPIRAL: 'spiral',
    RANDOM: 'random'
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

    // Play a sound when carving paths through the maze
    if (cells.length > 0 && audioService.isEnabled) {
        // Use frequency based on position in grid for musicality
        const middleCell = cells[Math.floor(cells.length / 2)];
        if (middleCell) {
            const note = middleCell.row % 8; // Use 8 different notes (octave)
            const baseFreq = 220; // A3
            const freq = baseFreq * Math.pow(2, note / 12); // Convert to frequency

            const tempSound = {
                soundType: 'oscillator',
                oscillatorType: 'sine',
                frequency: freq,
                duration: 0.2,
                volume: 0.1
            };

            audioService.playOscillator(tempSound);
        }
    }

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
    if (setIsGenerating) {
        setIsGenerating(true);
    }

    audioService.play('switch'); // Play sound when starting maze generation

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
        audioService.play('success'); // Play success sound when maze is complete
    } catch (error) {
        console.error('Maze generation error:', error);
        audioService.play('failure'); // Play failure sound if there's an error
    } finally {
        if (setIsGenerating) {
            setIsGenerating(false);
        }
    }
};

// Prim's Algorithm Implementation
export const primsMaze = async (grid, setGrid, setIsGenerating) => {
    if (setIsGenerating) {
        setIsGenerating(true);
    }

    audioService.play('switch'); // Play sound when starting maze generation

    try {
        // Initialize a grid filled with walls
        const newGrid = initializeMazeGrid(grid);

        // Track cells in the maze
        const visited = Array(GRID_SETTINGS.ROWS).fill().map(() => Array(GRID_SETTINGS.COLS).fill(false));

        // Start with a random cell (ensuring odd coordinates for grid alignment)
        const startRow = 1;
        const startCol = 1;

        // Mark the starting cell as visited and add to our maze
        visited[startRow][startCol] = true;
        newGrid[startRow][startCol].isWall = false;

        // Walls to consider (neighbors of cells in our maze)
        const walls = [];

        // Add the walls of the starting cell
        const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];

        for (const [dRow, dCol] of directions) {
            const newRow = startRow + dRow;
            const newCol = startCol + dCol;

            if (
                newRow >= 0 && newRow < GRID_SETTINGS.ROWS &&
                newCol >= 0 && newCol < GRID_SETTINGS.COLS
            ) {
                walls.push({
                    row: newRow,
                    col: newCol,
                    fromRow: startRow,
                    fromCol: startCol
                });
            }
        }

        // Create a batch for animation
        let animationBatch = [{ row: startRow, col: startCol }];

        // Main algorithm loop
        while (walls.length > 0) {
            // Pick a random wall
            const randomIndex = Math.floor(Math.random() * walls.length);
            const { row, col, fromRow, fromCol } = walls[randomIndex];

            // Remove this wall from our list
            walls.splice(randomIndex, 1);

            // Skip if out of bounds
            if (
                row < 0 || row >= GRID_SETTINGS.ROWS ||
                col < 0 || col >= GRID_SETTINGS.COLS
            ) {
                continue;
            }

            // If the cell on the opposite side of the wall is not in our maze yet
            if (!visited[row][col]) {
                // Add it to our maze
                visited[row][col] = true;
                newGrid[row][col].isWall = false;

                // Calculate and carve the wall between the cells
                const wallRow = (fromRow + row) / 2;
                const wallCol = (fromCol + col) / 2;
                newGrid[wallRow][wallCol].isWall = false;

                // Add to animation batch
                animationBatch.push(
                    { row: wallRow, col: wallCol },
                    { row, col }
                );

                // If batch is big enough, animate and clear
                if (animationBatch.length >= 3) {
                    await batchAnimateCells(animationBatch, setGrid);
                    animationBatch = [];
                }

                // Add the walls of this new cell
                for (const [dRow, dCol] of directions) {
                    const newRow = row + dRow;
                    const newCol = col + dCol;

                    if (
                        newRow >= 0 && newRow < GRID_SETTINGS.ROWS &&
                        newCol >= 0 && newCol < GRID_SETTINGS.COLS
                    ) {
                        walls.push({
                            row: newRow,
                            col: newCol,
                            fromRow: row,
                            fromCol: col
                        });
                    }
                }
            }
        }

        // Animate any remaining cells
        if (animationBatch.length > 0) {
            await batchAnimateCells(animationBatch, setGrid);
        }

        // Clear start and end positions
        const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        newGrid[START_NODE_ROW][START_NODE_COL].isWall = false;
        newGrid[FINISH_NODE_ROW][FINISH_NODE_COL].isWall = false;

        // Clean up any path-drawing visual markers
        setGrid(grid => grid.map(row => row.map(node => ({
            ...node,
            isPath: false,
            isDrawing: false
        }))));

        setGrid([...newGrid]);
        audioService.play('success'); // Play success sound when maze is complete
    } catch (error) {
        console.error('Prim\'s maze generation error:', error);
        audioService.play('failure'); // Play failure sound if there's an error
    } finally {
        if (setIsGenerating) {
            setIsGenerating(false);
        }
    }
};

// Recursive Division Maze Algorithm
export const recursiveDivisionMaze = async (grid, setGrid, setIsGenerating) => {
    if (setIsGenerating) {
        setIsGenerating(true);
    }

    audioService.play('switch'); // Play sound when starting maze generation

    try {
        // Start with an empty grid (no walls)
        const newGrid = grid.map(row => row.map(node => ({
            ...node,
            isWall: false,
            isVisited: false,
            previousNode: null,
            isDrawing: false,
            isPath: false
        })));

        // Add boundary walls
        for (let i = 0; i < GRID_SETTINGS.ROWS; i++) {
            newGrid[i][0].isWall = true;
            newGrid[i][GRID_SETTINGS.COLS - 1].isWall = true;
        }

        for (let j = 0; j < GRID_SETTINGS.COLS; j++) {
            newGrid[0][j].isWall = true;
            newGrid[GRID_SETTINGS.ROWS - 1][j].isWall = true;
        }

        setGrid([...newGrid]);
        await delay(50);

        // Helper recursive function
        const divideChamber = async (rowStart, rowEnd, colStart, colEnd, orientation) => {
            if (rowEnd - rowStart < 2 || colEnd - colStart < 2) return;

            // decide whether to draw a horizontal or vertical wall
            const horizontal = orientation === 'horizontal';

            // where to draw the wall
            const wallRow = horizontal
                ? Math.floor(Math.random() * (rowEnd - rowStart - 1)) + rowStart + 1
                : rowStart;

            const wallCol = horizontal
                ? colStart
                : Math.floor(Math.random() * (colEnd - colStart - 1)) + colStart + 1;

            // where to create a passage
            const passageRow = horizontal
                ? wallRow
                : Math.floor(Math.random() * (rowEnd - rowStart)) + rowStart;

            const passageCol = horizontal
                ? Math.floor(Math.random() * (colEnd - colStart)) + colStart
                : wallCol;

            // direction for drawing the wall
            const dRow = horizontal ? 0 : 1;
            const dCol = horizontal ? 1 : 0;

            // length of the wall
            const wallLength = horizontal ? colEnd - colStart : rowEnd - rowStart;

            // create walls with a batch for animation
            const wallCells = [];

            for (let i = 0; i < wallLength; i++) {
                if ((horizontal && i + colStart !== passageCol) ||
                    (!horizontal && i + rowStart !== passageRow)) {

                    const currentRow = wallRow + i * dRow;
                    const currentCol = wallCol + i * dCol;

                    // Skip if it's the start or end node
                    if (
                        (currentRow === GRID_SETTINGS.START_NODE_ROW && currentCol === GRID_SETTINGS.START_NODE_COL) ||
                        (currentRow === GRID_SETTINGS.FINISH_NODE_ROW && currentCol === GRID_SETTINGS.FINISH_NODE_COL)
                    ) {
                        continue;
                    }

                    newGrid[currentRow][currentCol].isWall = true;
                    wallCells.push({ row: currentRow, col: currentCol });
                }
            }

            // Animate wall placement
            setGrid(prevGrid => {
                const gridCopy = prevGrid.map(row => [...row]);
                wallCells.forEach(({row, col}) => {
                    gridCopy[row][col] = {
                        ...gridCopy[row][col],
                        isWall: true
                    };
                });
                return gridCopy;
            });

            // Play sound when placing a wall segment
            if (wallCells.length > 0) {
                const wallNote = horizontal ? 10 : 15; // Different notes for horizontal vs vertical walls
                const baseFreq = 200;
                const freq = baseFreq * Math.pow(2, wallNote / 24); // Quarter-tones for variety

                const tempSound = {
                    soundType: 'oscillator',
                    oscillatorType: 'sine',
                    frequency: freq,
                    duration: 0.2,
                    volume: 0.1
                };

                audioService.playOscillator(tempSound);
            }

            await delay(30);

            // recursively divide the chambers created by the new wall
            const newOrientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';

            if (horizontal) {
                await divideChamber(rowStart, wallRow, colStart, colEnd, newOrientation);
                await divideChamber(wallRow + 1, rowEnd, colStart, colEnd, newOrientation);
            } else {
                await divideChamber(rowStart, rowEnd, colStart, wallCol, newOrientation);
                await divideChamber(rowStart, rowEnd, wallCol + 1, colEnd, newOrientation);
            }
        };

        // Start the recursive division
        const orientation = GRID_SETTINGS.ROWS < GRID_SETTINGS.COLS ? 'horizontal' : 'vertical';
        await divideChamber(1, GRID_SETTINGS.ROWS - 1, 1, GRID_SETTINGS.COLS - 1, orientation);

        // Clear start and end positions
        const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        newGrid[START_NODE_ROW][START_NODE_COL].isWall = false;
        newGrid[FINISH_NODE_ROW][FINISH_NODE_COL].isWall = false;

        setGrid([...newGrid]);
        audioService.play('success'); // Play success sound when maze is complete
    } catch (error) {
        console.error('Recursive division maze generation error:', error);
        audioService.play('failure'); // Play failure sound if there's an error
    } finally {
        if (setIsGenerating) {
            setIsGenerating(false);
        }
    }
};

// Spiral maze generator
export const spiralMaze = async (grid, setGrid, setIsGenerating) => {
    if (setIsGenerating) {
        setIsGenerating(true);
    }

    audioService.play('switch'); // Play sound when starting maze generation

    try {
        // Start with an empty grid
        const newGrid = grid.map(row => row.map(node => ({
            ...node,
            isWall: false,
            isVisited: false,
            previousNode: null,
            isDrawing: false,
            isPath: false
        })));

        const center = {
            row: Math.floor(GRID_SETTINGS.ROWS / 2),
            col: Math.floor(GRID_SETTINGS.COLS / 2)
        };

        const maxRadius = Math.min(GRID_SETTINGS.ROWS, GRID_SETTINGS.COLS) / 2;
        const spacing = 2; // Space between spiral walls

        // Create spiral walls
        for (let radius = spacing; radius < maxRadius; radius += spacing) {
            const wallCells = [];

            for (let angle = 0; angle < 360; angle += 5) {
                const radians = angle * (Math.PI / 180);
                const row = Math.floor(center.row + radius * Math.sin(radians));
                const col = Math.floor(center.col + radius * Math.cos(radians));

                // Check if coordinates are valid and not start/finish nodes
                if (
                    row > 0 && row < GRID_SETTINGS.ROWS - 1 &&
                    col > 0 && col < GRID_SETTINGS.COLS - 1 &&
                    row !== GRID_SETTINGS.START_NODE_ROW && col !== GRID_SETTINGS.START_NODE_COL &&
                    row !== GRID_SETTINGS.FINISH_NODE_ROW && col !== GRID_SETTINGS.FINISH_NODE_COL
                ) {
                    newGrid[row][col].isWall = true;
                    wallCells.push({ row, col });
                }
            }

            // Render each spiral layer with a short delay
            setGrid(prevGrid => {
                const gridCopy = prevGrid.map(row => [...row]);
                wallCells.forEach(({row, col}) => {
                    gridCopy[row][col] = {
                        ...gridCopy[row][col],
                        isWall: true
                    };
                });
                return gridCopy;
            });

            // Play a spiral sound based on radius
            const baseFreq = 200;
            const note = (radius / 2) % 12; // Cycle through an octave
            const freq = baseFreq * Math.pow(2, note / 12);

            const tempSound = {
                soundType: 'oscillator',
                oscillatorType: 'sine',
                frequency: freq,
                duration: 0.2,
                volume: 0.1
            };

            audioService.playOscillator(tempSound);

            await delay(50);

            // Add a gap in the spiral for each layer (to make it solvable)
            const gapAngle = Math.random() * 360;
            const gapRadians = gapAngle * (Math.PI / 180);
            const gapRow = Math.floor(center.row + radius * Math.sin(gapRadians));
            const gapCol = Math.floor(center.col + radius * Math.cos(gapRadians));

            if (
                gapRow > 0 && gapRow < GRID_SETTINGS.ROWS - 1 &&
                gapCol > 0 && gapCol < GRID_SETTINGS.COLS - 1
            ) {
                newGrid[gapRow][gapCol].isWall = false;
            }
        }

        // Add paths from start and end to the spiral
        const createPath = (fromRow, fromCol, toRow, toCol) => {
            const path = [];
            let currentRow = fromRow;
            let currentCol = fromCol;

            while (currentRow !== toRow || currentCol !== toCol) {
                if (currentRow < toRow) currentRow++;
                else if (currentRow > toRow) currentRow--;

                if (currentCol < toCol) currentCol++;
                else if (currentCol > toCol) currentCol--;

                if (
                    currentRow !== GRID_SETTINGS.START_NODE_ROW ||
                    currentCol !== GRID_SETTINGS.START_NODE_COL
                ) {
                    if (
                        currentRow !== GRID_SETTINGS.FINISH_NODE_ROW ||
                        currentCol !== GRID_SETTINGS.FINISH_NODE_COL
                    ) {
                        path.push({ row: currentRow, col: currentCol });
                    }
                }
            }

            return path;
        };

        // Create paths from start and end to the center
        const pathFromStart = createPath(
            GRID_SETTINGS.START_NODE_ROW,
            GRID_SETTINGS.START_NODE_COL,
            center.row,
            center.col
        );

        const pathFromEnd = createPath(
            GRID_SETTINGS.FINISH_NODE_ROW,
            GRID_SETTINGS.FINISH_NODE_COL,
            center.row,
            center.col
        );

        // Clear the paths
        [...pathFromStart, ...pathFromEnd].forEach(({row, col}) => {
            newGrid[row][col].isWall = false;
        });

        // Animate the path creation
        await batchAnimateCells([...pathFromStart, ...pathFromEnd], setGrid);

        setGrid([...newGrid]);
        audioService.play('success'); // Play success sound when maze is complete
    } catch (error) {
        console.error('Spiral maze generation error:', error);
        audioService.play('failure'); // Play failure sound if there's an error
    } finally {
        if (setIsGenerating) {
            setIsGenerating(false);
        }
    }
};

// Random maze generator with configurable density
export const randomMaze = async (grid, setGrid, setIsGenerating, density = 0.3) => {
    if (setIsGenerating) {
        setIsGenerating(true);
    }

    audioService.play('switch'); // Play sound when starting maze generation

    try {
        // Create a grid with random walls
        const newGrid = grid.map(row =>
            row.map(node => {
                // Preserve start and end nodes
                if (
                    (node.row === GRID_SETTINGS.START_NODE_ROW && node.col === GRID_SETTINGS.START_NODE_COL) ||
                    (node.row === GRID_SETTINGS.FINISH_NODE_ROW && node.col === GRID_SETTINGS.FINISH_NODE_COL)
                ) {
                    return {
                        ...node,
                        isWall: false,
                        isVisited: false,
                        previousNode: null,
                        isDrawing: false,
                        isPath: false
                    };
                }

                // Randomly decide if this cell is a wall
                return {
                    ...node,
                    isWall: Math.random() < density,
                    isVisited: false,
                    previousNode: null,
                    isDrawing: false,
                    isPath: false
                };
            })
        );

        // Clear start and end positions and immediate surroundings
        const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;

        // Clear area around start
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                const row = START_NODE_ROW + r;
                const col = START_NODE_COL + c;
                if (
                    row >= 0 && row < GRID_SETTINGS.ROWS &&
                    col >= 0 && col < GRID_SETTINGS.COLS
                ) {
                    newGrid[row][col].isWall = false;
                }
            }
        }

        // Clear area around finish
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                const row = FINISH_NODE_ROW + r;
                const col = FINISH_NODE_COL + c;
                if (
                    row >= 0 && row < GRID_SETTINGS.ROWS &&
                    col >= 0 && col < GRID_SETTINGS.COLS
                ) {
                    newGrid[row][col].isWall = false;
                }
            }
        }

        // Animate the maze generation
        const chunkSize = 50; // Number of cells to update at once
        const totalCells = GRID_SETTINGS.ROWS * GRID_SETTINGS.COLS;

        for (let i = 0; i < totalCells; i += chunkSize) {
            const chunk = [];

            for (let j = i; j < Math.min(i + chunkSize, totalCells); j++) {
                const row = Math.floor(j / GRID_SETTINGS.COLS);
                const col = j % GRID_SETTINGS.COLS;
                chunk.push({ row, col });
            }

            // Apply the chunk update
            setGrid(prevGrid => {
                const gridCopy = prevGrid.map(row => [...row]);
                chunk.forEach(({row, col}) => {
                    gridCopy[row][col] = { ...newGrid[row][col] };
                });
                return gridCopy;
            });

            // Play randomized sound for each chunk
            if (i % (chunkSize * 4) === 0) { // Play sound less frequently
                const chunkNote = Math.floor(Math.random() * 12);
                const baseFreq = 300;
                const freq = baseFreq * Math.pow(2, chunkNote / 12);

                const tempSound = {
                    soundType: 'oscillator',
                    oscillatorType: 'sine',
                    frequency: freq,
                    duration: 0.2,
                    volume: 0.1
                };

                audioService.playOscillator(tempSound);
            }

            await delay(10);
        }

        audioService.play('success'); // Play success sound when maze is complete
    } catch (error) {
        console.error('Random maze generation error:', error);
        audioService.play('failure'); // Play failure sound if there's an error
    } finally {
        if (setIsGenerating) {
            setIsGenerating(false);
        }
    }
};

// Factory function to get the right maze generator
export const getMazeGenerator = (type) => {
    switch (type) {
        case MAZE_TYPES.BACKTRACKING:
            return backtrackingMaze;
        case MAZE_TYPES.PRIMS:
            return primsMaze;
        case MAZE_TYPES.DIVISION:
            return recursiveDivisionMaze;
        case MAZE_TYPES.SPIRAL:
            return spiralMaze;
        case MAZE_TYPES.RANDOM:
            return randomMaze;
        default:
            return backtrackingMaze;
    }
};