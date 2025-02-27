import { GRID_SETTINGS } from './gridUtils';
import audioService from './AudioService';

export const MAZE_TYPES = {
    BACKTRACKING: 'backtracking',
    PRIMS: 'prims',
    DIVISION: 'division',
    SPIRAL: 'spiral',
    RANDOM: 'random',
    KRUSKAL: 'kruskal',
    ELLER: 'eller'
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

// Kruskal's Algorithm Maze Generator
export const kruskalMaze = async (grid, setGrid, setIsGenerating) => {
    if (setIsGenerating) {
        setIsGenerating(true);
    }

    audioService.play('switch'); // Play sound when starting maze generation

    try {
        // Initialize grid with all walls
        const newGrid = initializeMazeGrid(grid);

        // Create cells and walls data structures
        const walls = [];
        const disjointSet = new DisjointSet(GRID_SETTINGS.ROWS * GRID_SETTINGS.COLS);

        // Initialize cells (only use odd row/column coordinates for cells)
        for (let row = 1; row < GRID_SETTINGS.ROWS; row += 2) {
            for (let col = 1; col < GRID_SETTINGS.COLS; col += 2) {

                // Mark the cell as a passage
                newGrid[row][col].isWall = false;
            }
        }

        // Initialize walls between cells (only interior walls)
        for (let row = 1; row < GRID_SETTINGS.ROWS; row += 2) {
            for (let col = 1; col < GRID_SETTINGS.COLS; col += 2) {
                // Add horizontal walls
                if (col + 2 < GRID_SETTINGS.COLS) {
                    walls.push({
                        row: row,
                        col: col + 1,
                        cell1: (row * GRID_SETTINGS.COLS) + col,
                        cell2: (row * GRID_SETTINGS.COLS) + (col + 2)
                    });
                }

                // Add vertical walls
                if (row + 2 < GRID_SETTINGS.ROWS) {
                    walls.push({
                        row: row + 1,
                        col: col,
                        cell1: (row * GRID_SETTINGS.COLS) + col,
                        cell2: ((row + 2) * GRID_SETTINGS.COLS) + col
                    });
                }
            }
        }

        // Shuffle walls
        for (let i = walls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [walls[i], walls[j]] = [walls[j], walls[i]];
        }

        // Apply initial grid state
        setGrid([...newGrid]);
        await delay(50);

        // Kruskal's algorithm - process each wall
        for (const wall of walls) {
            const { row, col, cell1, cell2 } = wall;

            // If the cells separated by this wall aren't connected yet
            if (disjointSet.find(cell1) !== disjointSet.find(cell2)) {
                // Remove the wall
                newGrid[row][col].isWall = false;

                // Merge the sets
                disjointSet.union(cell1, cell2);

                // Animate the wall removal
                setGrid(prevGrid => {
                    const gridCopy = prevGrid.map(row => [...row]);
                    gridCopy[row][col].isWall = false;
                    return gridCopy;
                });

                // Play sound for removing a wall
                const baseFreq = 300;
                const note = Math.floor(row % 12);
                const freq = baseFreq * Math.pow(2, note / 12);

                const tempSound = {
                    soundType: 'oscillator',
                    oscillatorType: 'sine',
                    frequency: freq,
                    duration: 0.05,
                    volume: 0.1
                };

                audioService.playOscillator(tempSound);

                await delay(5);
            }
        }

        // Clear start and end positions
        const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        newGrid[START_NODE_ROW][START_NODE_COL].isWall = false;
        newGrid[FINISH_NODE_ROW][FINISH_NODE_COL].isWall = false;

        setGrid([...newGrid]);
        audioService.play('success'); // Play success sound when maze is complete
    } catch (error) {
        console.error('Kruskal\'s maze generation error:', error);
        audioService.play('failure'); // Play failure sound if there's an error
    } finally {
        if (setIsGenerating) {
            setIsGenerating(false);
        }
    }
};

// DisjointSet data structure for Kruskal's algorithm
class DisjointSet {
    constructor(size) {
        this.parent = Array(size).fill().map((_, i) => i);
        this.rank = Array(size).fill(0);
    }

    find(x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]); // Path compression
        }
        return this.parent[x];
    }

    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) return;

        // Union by rank
        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
    }
}

// Eller's Algorithm Maze Generator
// Eller's Algorithm Maze Generator (Fixed with proper bottom row)
export const ellerMaze = async (grid, setGrid, setIsGenerating) => {
    if (setIsGenerating) {
        setIsGenerating(true);
    }

    audioService.play('switch'); // Play sound when starting maze generation

    try {
        // Initialize grid with all walls
        const newGrid = initializeMazeGrid(grid);

        // Apply initial grid state to visualize the starting point
        setGrid([...newGrid]);
        await delay(50);

        // Use only odd row and column indices for cells
        const width = Math.floor(GRID_SETTINGS.COLS / 2);

        // Initialize the first row with each cell in its own set
        let currentRow = [];
        for (let col = 0; col < width; col++) {
            currentRow[col] = col + 1; // Set ID (0 is reserved for walls)

            // Mark cell locations as passages
            const actualRow = 1;
            const actualCol = col * 2 + 1;
            newGrid[actualRow][actualCol].isWall = false;

            // Visualize initial cell creation
            setGrid(prevGrid => {
                const gridCopy = prevGrid.map(gridRow => [...gridRow]);
                gridCopy[actualRow][actualCol].isWall = false;
                return gridCopy;
            });

            await delay(5);
        }

        // Process each row
        for (let row = 0; row < Math.floor(GRID_SETTINGS.ROWS / 2) - 1; row++) {
            const actualRow = row * 2 + 1;

            // 1. Create right connections
            for (let col = 0; col < width - 1; col++) {
                // Randomly decide whether to connect to the right
                const connectRight = Math.random() < 0.5;

                if (connectRight) {
                    // Only connect if cells are in different sets
                    if (currentRow[col] !== currentRow[col + 1]) {
                        // Connect the cells by removing the wall
                        const actualCol = col * 2 + 1;
                        newGrid[actualRow][actualCol + 1].isWall = false;

                        // Merge the sets
                        const oldSet = currentRow[col + 1];
                        const newSet = currentRow[col];
                        for (let i = 0; i < width; i++) {
                            if (currentRow[i] === oldSet) {
                                currentRow[i] = newSet;
                            }
                        }

                        // Animate wall removal
                        setGrid(prevGrid => {
                            const gridCopy = prevGrid.map(gridRow => [...gridRow]);
                            gridCopy[actualRow][actualCol + 1].isWall = false;
                            return gridCopy;
                        });

                        // Play a sound based on position
                        const baseFreq = 250;
                        const note = (actualRow + actualCol) % 12;
                        const freq = baseFreq * Math.pow(2, note / 24);

                        const tempSound = {
                            soundType: 'oscillator',
                            oscillatorType: 'sine',
                            frequency: freq,
                            duration: 0.03,
                            volume: 0.1
                        };

                        audioService.playOscillator(tempSound);

                        await delay(10);
                    }
                }
            }

            // 2. Initialize next row with no connections
            let nextRow = Array(width).fill(0);

            // Create cells for the next row
            for (let col = 0; col < width; col++) {
                const actualCol = col * 2 + 1;
                const nextActualRow = actualRow + 2;

                // Create cell
                newGrid[nextActualRow][actualCol].isWall = false;

                // Visualize next row cell creation
                setGrid(prevGrid => {
                    const gridCopy = prevGrid.map(gridRow => [...gridRow]);
                    gridCopy[nextActualRow][actualCol].isWall = false;
                    return gridCopy;
                });

                await delay(5);
            }

            // 3. Create down connections and propagate sets
            // For each set in the current row, create at least one downward connection
            const setsInRow = new Set(currentRow);
            const setConnections = {};

            // First pass: ensure at least one connection per set
            for (const setId of setsInRow) {
                // Find all columns with this set ID
                const columns = currentRow.map((id, col) => id === setId ? col : -1).filter(col => col !== -1);

                // Choose at least one random column to connect downward
                const randomCol = columns[Math.floor(Math.random() * columns.length)];

                // Connect downward
                const actualCol = randomCol * 2 + 1;
                newGrid[actualRow + 1][actualCol].isWall = false;

                // Mark this set as having at least one connection
                setConnections[setId] = true;

                // Propagate set to the next row
                nextRow[randomCol] = setId;

                // Animate wall removal
                setGrid(prevGrid => {
                    const gridCopy = prevGrid.map(gridRow => [...gridRow]);
                    gridCopy[actualRow + 1][actualCol].isWall = false;
                    return gridCopy;
                });

                // Play a sound
                const baseFreq = 300;
                const note = (actualRow + 1) % 12;
                const freq = baseFreq * Math.pow(2, note / 24);

                const tempSound = {
                    soundType: 'oscillator',
                    oscillatorType: 'sine',
                    frequency: freq,
                    duration: 0.03,
                    volume: 0.1
                };

                audioService.playOscillator(tempSound);

                await delay(10);
            }

            // Second pass: randomly add more connections
            for (let col = 0; col < width; col++) {
                const setId = currentRow[col];

                // Skip if this is the only cell in its set
                const setCount = currentRow.filter(id => id === setId).length;
                if (setCount === 1) continue;

                // Skip with higher probability if we already have a connection for this set
                if (setConnections[setId] && Math.random() < 0.7) continue;

                // Randomly decide whether to connect down
                const connectDown = Math.random() < 0.3;

                if (connectDown) {
                    // Connect to the cell below
                    const actualCol = col * 2 + 1;
                    newGrid[actualRow + 1][actualCol].isWall = false;

                    // Propagate set to the next row
                    nextRow[col] = setId;

                    // Mark this set as having a connection
                    setConnections[setId] = true;

                    // Animate wall removal
                    setGrid(prevGrid => {
                        const gridCopy = prevGrid.map(gridRow => [...gridRow]);
                        gridCopy[actualRow + 1][actualCol].isWall = false;
                        return gridCopy;
                    });

                    // Play a sound
                    const baseFreq = 350;
                    const note = col % 12;
                    const freq = baseFreq * Math.pow(2, note / 24);

                    const tempSound = {
                        soundType: 'oscillator',
                        oscillatorType: 'sine',
                        frequency: freq,
                        duration: 0.03,
                        volume: 0.1
                    };

                    audioService.playOscillator(tempSound);

                    await delay(10);
                }
            }

            // 4. Assign new set IDs to cells without a set in the next row
            let nextSetId = Math.max(...currentRow, 0) + 1;
            for (let col = 0; col < width; col++) {
                if (nextRow[col] === 0) {
                    nextRow[col] = nextSetId++;
                }
            }

            // Update current row
            currentRow = nextRow;
        }

        // Process the final row - but SELECTIVELY connect cells to maintain complexity
        const finalRowIndex = (Math.floor(GRID_SETTINGS.ROWS / 2) - 1) * 2 + 1;

        // Create a union-find data structure to track connected components
        const unionFind = {};
        currentRow.forEach(setId => {
            unionFind[setId] = setId;
        });

        const find = (x) => {
            if (unionFind[x] !== x) {
                unionFind[x] = find(unionFind[x]);
            }
            return unionFind[x];
        };

        const union = (x, y) => {
            unionFind[find(x)] = find(y);
        };

        // Get initial number of distinct sets
        let distinctSets = new Set(currentRow.map(setId => find(setId))).size;

        // Randomly connect cells until all are in the same set
        // But limit connections to maintain complexity
        const maxConnections = Math.ceil(width * 0.4); // Limit to 40% of possible connections
        let connections = 0;

        while (distinctSets > 1 && connections < maxConnections) {
            // Choose a random column
            const col = Math.floor(Math.random() * (width - 1));

            // If cells are in different sets, connect them
            if (find(currentRow[col]) !== find(currentRow[col + 1])) {
                const actualCol = col * 2 + 1;
                newGrid[finalRowIndex][actualCol + 1].isWall = false;

                // Union the sets
                union(currentRow[col], currentRow[col + 1]);

                // Animate wall removal
                setGrid(prevGrid => {
                    const gridCopy = prevGrid.map(gridRow => [...gridRow]);
                    gridCopy[finalRowIndex][actualCol + 1].isWall = false;
                    return gridCopy;
                });

                // Play a sound
                const baseFreq = 400;
                const note = col % 12;
                const freq = baseFreq * Math.pow(2, note / 24);

                const tempSound = {
                    soundType: 'oscillator',
                    oscillatorType: 'sine',
                    frequency: freq,
                    duration: 0.03,
                    volume: 0.1
                };

                audioService.playOscillator(tempSound);

                await delay(10);

                // Increment connections counter
                connections++;

                // Recalculate distinct sets
                distinctSets = new Set(currentRow.map(setId => find(setId))).size;
            }
        }

        // If we still have multiple sets, force connections until all are connected
        // This ensures the maze is solvable while maintaining complexity
        while (distinctSets > 1) {
            // Find the first adjacent cells in different sets
            for (let col = 0; col < width - 1; col++) {
                if (find(currentRow[col]) !== find(currentRow[col + 1])) {
                    const actualCol = col * 2 + 1;
                    newGrid[finalRowIndex][actualCol + 1].isWall = false;

                    // Union the sets
                    union(currentRow[col], currentRow[col + 1]);

                    // Animate wall removal
                    setGrid(prevGrid => {
                        const gridCopy = prevGrid.map(gridRow => [...gridRow]);
                        gridCopy[finalRowIndex][actualCol + 1].isWall = false;
                        return gridCopy;
                    });

                    await delay(10);

                    // Recalculate distinct sets
                    distinctSets = new Set(currentRow.map(setId => find(setId))).size;
                    break;
                }
            }
        }

        // Clear start and end positions
        const { START_NODE_ROW, START_NODE_COL, FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        newGrid[START_NODE_ROW][START_NODE_COL].isWall = false;
        newGrid[FINISH_NODE_ROW][FINISH_NODE_COL].isWall = false;

        setGrid([...newGrid]);
        audioService.play('success'); // Play success sound when maze is complete
    } catch (error) {
        console.error("Eller's maze generation error:", error);
        audioService.play('failure'); // Play failure sound if there's an error
    } finally {
        if (setIsGenerating) {
            setIsGenerating(false);
        }
    }
};
// Helper function for Eller's algorithm to animate wall removal
const animateWallRemoval = async (row, col, newGrid, setGrid) => {
    newGrid[row][col].isWall = false;

    setGrid(prevGrid => {
        const gridCopy = prevGrid.map(gridRow => [...gridRow]);
        gridCopy[row][col].isWall = false;
        return gridCopy;
    });

    // Play a sound based on position
    const baseFreq = 250;
    const note = (row + col) % 12; // Use combined position for variety
    const freq = baseFreq * Math.pow(2, note / 24); // Quarter tones for more variety

    const tempSound = {
        soundType: 'oscillator',
        oscillatorType: 'sine',
        frequency: freq,
        duration: 0.03,
        volume: 0.1
    };

    audioService.playOscillator(tempSound);

    await delay(5); // Brief delay for animation
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
        case MAZE_TYPES.KRUSKAL:
            return kruskalMaze;
        case MAZE_TYPES.ELLER:
            return ellerMaze;  // Add this line
        default:
            return backtrackingMaze;
    }
};