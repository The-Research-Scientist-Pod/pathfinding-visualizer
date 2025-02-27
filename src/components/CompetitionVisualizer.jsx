import React, { useState, useCallback, useEffect } from 'react';
import { getInitialGrid, getNewGridWithWallToggled, getNodesInShortestPath, GRID_SETTINGS } from '../utils/gridUtils';
import { dijkstra } from '../algorithms/dijkstra';
import { astar } from '../algorithms/astar';
import { breadthFirstSearch } from '../algorithms/breadthFirst';
import { depthFirstSearch } from '../algorithms/depthFirst';
import { bellmanFord } from '../algorithms/bellmanFord';
import { bidirectionalSearch } from "../algorithms/bidirectional";
import { getMazeGenerator, MAZE_TYPES } from '../utils/mazeGenerators';
import Grid from './Grid';
import Stats from './Stats';
import Legend from './Legend';
import audioService from "../utils/AudioService.js";
import AudioControls from './AudioControls';

const CompetitionVisualizer = () => {
    // Orientation detection
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    // Grids state
    const [gridLeft, setGridLeft] = useState(() => getInitialGrid());
    const [gridRight, setGridRight] = useState(() => getInitialGrid());

    // Interactive state
    const [activeGrid, setActiveGrid] = useState('left'); // 'left' or 'right'
    const [isMousePressed, setIsMousePressed] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Algorithm settings
    const [algorithmLeft, setAlgorithmLeft] = useState('dijkstra');
    const [algorithmRight, setAlgorithmRight] = useState('astar');
    const [speed, setSpeed] = useState('normal');
    const [syncWalls, setSyncWalls] = useState(true);
    const [mazeType, setMazeType] = useState(MAZE_TYPES.BACKTRACKING);

    // Results
    const [statsLeft, setStatsLeft] = useState({
        algorithm: 'dijkstra',
        nodesVisited: 0,
        pathLength: 0,
        executionTime: 0,
        memoryUsed: 0,
        pathEfficiency: 0,
        manhattanDistance: 0
    });

    const [statsRight, setStatsRight] = useState({
        algorithm: 'astar',
        nodesVisited: 0,
        pathLength: 0,
        executionTime: 0,
        memoryUsed: 0,
        pathEfficiency: 0,
        manhattanDistance: 0
    });

    const [winner, setWinner] = useState(null);

    // Handle orientation changes
    useEffect(() => {
        const handleResize = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Animation speed settings
    const getAnimationDelays = () => {
        switch (speed) {
            case 'veryfast': return { visit: 5, path: 10 };
            case 'fast': return { visit: 10, path: 20 };
            case 'slow': return { visit: 50, path: 100 };
            default: return { visit: 30, path: 60 };
        }
    };

    // Mouse event handlers for left grid
    const handleMouseDownLeft = (row, col) => {
        if (isRunning || isGenerating) return;
        setActiveGrid('left');
        const newGridLeft = getNewGridWithWallToggled(gridLeft, row, col);

        // Play sound when a wall is added or removed
        const isWallNow = newGridLeft[row][col].isWall;
        audioService.play(isWallNow ? 'wallAdd' : 'wallRemove');

        setGridLeft(newGridLeft);

        if (syncWalls) {
            const newGridRight = getNewGridWithWallToggled(gridRight, row, col);
            setGridRight(newGridRight);
        }

        setIsMousePressed(true);
    };

    const handleMouseEnterLeft = (row, col) => {
        if (!isMousePressed || isRunning || isGenerating || activeGrid !== 'left') return;
        const newGridLeft = getNewGridWithWallToggled(gridLeft, row, col);

        // Play sound for wall placement, but only if the state is actually changing
        if (gridLeft[row][col].isWall !== newGridLeft[row][col].isWall) {
            const isWallNow = newGridLeft[row][col].isWall;
            audioService.play(isWallNow ? 'wallAdd' : 'wallRemove');
        }

        setGridLeft(newGridLeft);

        if (syncWalls) {
            const newGridRight = getNewGridWithWallToggled(gridRight, row, col);
            setGridRight(newGridRight);
        }
    };

    // Mouse event handlers for right grid
    const handleMouseDownRight = (row, col) => {
        if (isRunning || isGenerating) return;
        setActiveGrid('right');
        const newGridRight = getNewGridWithWallToggled(gridRight, row, col);

        // Play sound when a wall is added or removed
        const isWallNow = newGridRight[row][col].isWall;
        audioService.play(isWallNow ? 'wallAdd' : 'wallRemove');

        setGridRight(newGridRight);

        if (syncWalls) {
            const newGridLeft = getNewGridWithWallToggled(gridLeft, row, col);
            setGridLeft(newGridLeft);
        }

        setIsMousePressed(true);
    };

    const handleMouseEnterRight = (row, col) => {
        if (!isMousePressed || isRunning || isGenerating || activeGrid !== 'right') return;
        const newGridRight = getNewGridWithWallToggled(gridRight, row, col);

        // Play sound for wall placement, but only if the state is actually changing
        if (gridRight[row][col].isWall !== newGridRight[row][col].isWall) {
            const isWallNow = newGridRight[row][col].isWall;
            audioService.play(isWallNow ? 'wallAdd' : 'wallRemove');
        }

        setGridRight(newGridRight);

        if (syncWalls) {
            const newGridLeft = getNewGridWithWallToggled(gridLeft, row, col);
            setGridLeft(newGridLeft);
        }
    };

    const handleMouseUp = () => {
        setIsMousePressed(false);
        setActiveGrid(null);
    };

    // Animation functions for left grid
    const animateNodeLeft = async (node) => {
        const { visit } = getAnimationDelays();
        return new Promise(resolve => {
            setTimeout(() => {
                setGridLeft(grid => {
                    const newGrid = grid.map(row => [...row]);
                    newGrid[node.row][node.col] = {
                        ...newGrid[node.row][node.col],
                        isVisited: true,
                    };
                    return newGrid;
                });

                // Play position-based sound for each visited node (left grid)
                audioService.playVisitSound(node.row, node.col, GRID_SETTINGS.COLS, 'left');

                resolve();
            }, visit);
        });
    };

    // Animation functions for right grid
    const animateNodeRight = async (node) => {
        const { visit } = getAnimationDelays();
        return new Promise(resolve => {
            setTimeout(() => {
                setGridRight(grid => {
                    const newGrid = grid.map(row => [...row]);
                    newGrid[node.row][node.col] = {
                        ...newGrid[node.row][node.col],
                        isVisited: true,
                    };
                    return newGrid;
                });

                // Play position-based sound for each visited node (right grid)
                audioService.playVisitSound(node.row, node.col, GRID_SETTINGS.COLS, 'right');

                resolve();
            }, visit);
        });
    };

    const animatePathLeft = async (visitedNodesInOrder, nodesInPath) => {
        const { path } = getAnimationDelays();
        for (let i = 0; i < nodesInPath.length; i += 3) {
            await new Promise(resolve => {
                setTimeout(() => {
                    setGridLeft(grid => {
                        const newGrid = grid.map(row => [...row]);
                        for (let j = i; j < Math.min(i + 3, nodesInPath.length); j++) {
                            const node = nodesInPath[j];
                            newGrid[node.row][node.col] = {
                                ...newGrid[node.row][node.col],
                                isPath: true,
                                className: 'node-shortest-path'
                            };
                        }
                        return newGrid;
                    });

                    // Play path sound less frequently in competition mode
                    if (i % 6 === 0) {
                        audioService.playPathSound(i, nodesInPath.length, 'left');
                    }

                    resolve();
                }, path);
            });
        }
    };

    const animatePathRight = async (visitedNodesInOrder, nodesInPath) => {
        const { path } = getAnimationDelays();
        for (let i = 0; i < nodesInPath.length; i += 3) {
            await new Promise(resolve => {
                setTimeout(() => {
                    setGridRight(grid => {
                        const newGrid = grid.map(row => [...row]);
                        for (let j = i; j < Math.min(i + 3, nodesInPath.length); j++) {
                            const node = nodesInPath[j];
                            newGrid[node.row][node.col] = {
                                ...newGrid[node.row][node.col],
                                isPath: true,
                                className: 'node-shortest-path'
                            };
                        }
                        return newGrid;
                    });

                    // Play path sound less frequently in competition mode
                    if (i % 6 === 0) {
                        audioService.playPathSound(i, nodesInPath.length, 'right');
                    }

                    resolve();
                }, path);
            });
        }
    };

    // Grid manipulation functions
    const handleSpeedChange = (newSpeed) => {
        setSpeed(newSpeed);
        audioService.play('click');
    };

    const resetGrids = useCallback(() => {
        if (isRunning || isGenerating) return;
        audioService.play('reset');
        setGridLeft(getInitialGrid());
        setGridRight(getInitialGrid());
        setStatsLeft({
            algorithm: algorithmLeft,
            nodesVisited: 0,
            pathLength: 0,
            executionTime: 0,
            memoryUsed: 0,
            pathEfficiency: 0,
            manhattanDistance: 0
        });
        setStatsRight({
            algorithm: algorithmRight,
            nodesVisited: 0,
            pathLength: 0,
            executionTime: 0,
            memoryUsed: 0,
            pathEfficiency: 0,
            manhattanDistance: 0
        });
        setWinner(null);
    }, [isRunning, isGenerating, algorithmLeft, algorithmRight]);

    const clearPaths = () => {
        if (isRunning || isGenerating) return;
        audioService.play('click');

        // Clear left grid paths
        setGridLeft(grid =>
            grid.map(row =>
                row.map(node => ({
                    ...node,
                    isVisited: false,
                    isPath: false,
                    distance: Infinity,
                    f: Infinity,
                    g: Infinity,
                    h: Infinity,
                    previousNode: null,
                }))
            )
        );

        // Clear right grid paths
        setGridRight(grid =>
            grid.map(row =>
                row.map(node => ({
                    ...node,
                    isVisited: false,
                    isPath: false,
                    distance: Infinity,
                    f: Infinity,
                    g: Infinity,
                    h: Infinity,
                    previousNode: null,
                }))
            )
        );

        setWinner(null);
    };

    const generateMazes = async () => {
        if (isRunning || isGenerating) return;
        audioService.play('click');
        resetGrids();
        setIsGenerating(true);

        try {
            // Get the appropriate maze generator function
            const mazeGenerator = getMazeGenerator(mazeType);

            // Run maze generation algorithms in parallel
            await Promise.all([
                mazeGenerator(gridLeft, setGridLeft),
                mazeGenerator(gridRight, setGridRight)
            ]);

            audioService.play('success');
        } catch (error) {
            console.error('Error generating mazes:', error);
            audioService.play('failure');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyMazeLeftToRight = () => {
        if (isRunning || isGenerating) return;
        audioService.play('switch');
        setGridRight(gridLeft.map(row => row.map(node => ({ ...node }))));
        clearPaths();
    };

    const copyMazeRightToLeft = () => {
        if (isRunning || isGenerating) return;
        audioService.play('switch');
        setGridLeft(gridRight.map(row => row.map(node => ({ ...node }))));
        clearPaths();
    };

    const getAlgorithmFunction = (algorithm) => {
        switch (algorithm) {
            case 'dijkstra': return dijkstra;
            case 'astar': return astar;
            case 'bfs': return breadthFirstSearch;
            case 'dfs': return depthFirstSearch;
            case 'bellmanFord': return bellmanFord;
            case 'bidirectional': return bidirectionalSearch;

            default: return dijkstra;
        }
    };

    const compareAlgorithms = async () => {
        if (isRunning || isGenerating) return;
        clearPaths();
        audioService.play('click');
        setIsRunning(true);
        setWinner(null);

        try {
            // Get algorithm functions
            const leftAlgorithm = getAlgorithmFunction(algorithmLeft);
            const rightAlgorithm = getAlgorithmFunction(algorithmRight);

            // Run algorithms in parallel
            const [leftResult, rightResult] = await Promise.all([
                leftAlgorithm(gridLeft, animateNodeLeft),
                rightAlgorithm(gridRight, animateNodeRight)
            ]);

            // Update stats
            setStatsLeft({ ...leftResult.stats, algorithm: algorithmLeft });
            setStatsRight({ ...rightResult.stats, algorithm: algorithmRight });

            // Get paths
            const { FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
            const leftPath = getNodesInShortestPath(gridLeft[FINISH_NODE_ROW][FINISH_NODE_COL]);
            const rightPath = getNodesInShortestPath(gridRight[FINISH_NODE_ROW][FINISH_NODE_COL]);

            // Animate paths
            await Promise.all([
                animatePathLeft(leftResult.visitedNodesInOrder, leftPath),
                animatePathRight(rightResult.visitedNodesInOrder, rightPath)
            ]);

            // Determine winner based on path length and execution time
            if (leftPath.length && rightPath.length) {
                if (leftPath.length < rightPath.length) {
                    setWinner('left');
                    audioService.play('winLeft');
                } else if (rightPath.length < leftPath.length) {
                    setWinner('right');
                    audioService.play('winRight');
                } else if (leftResult.stats.executionTime < rightResult.stats.executionTime) {
                    setWinner('left');
                    audioService.play('winLeft');
                } else if (rightResult.stats.executionTime < leftResult.stats.executionTime) {
                    setWinner('right');
                    audioService.play('winRight');
                } else {
                    setWinner('tie');
                    audioService.play('tie');
                }
            } else if (leftPath.length) {
                setWinner('left');
                audioService.play('winLeft');
            } else if (rightPath.length) {
                setWinner('right');
                audioService.play('winRight');
            } else {
                audioService.play('failure');
            }

        } catch (error) {
            console.error('Error during algorithm comparison:', error);
            audioService.play('failure');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-1 container mx-auto px-1 py-1 flex flex-col max-h-screen overflow-auto">
                {/* Controls Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-white rounded-lg shadow-sm mb-2">
                    <div className="flex flex-wrap gap-2 items-center justify-center">
                        <select
                            className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={algorithmLeft}
                            onChange={(e) => setAlgorithmLeft(e.target.value)}
                            disabled={isRunning || isGenerating}
                        >
                            <option value="dijkstra">Dijkstra's</option>
                            <option value="astar">A*</option>
                            <option value="bfs">BFS</option>
                            <option value="dfs">DFS</option>
                            <option value="bellmanFord">Bellman-Ford</option>
                            <option value="bidirectional">Bidirectional</option>

                        </select>

                        <span className="font-bold">VS</span>

                        <select
                            className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={algorithmRight}
                            onChange={(e) => setAlgorithmRight(e.target.value)}
                            disabled={isRunning || isGenerating}
                        >
                            <option value="dijkstra">Dijkstra's</option>
                            <option value="astar">A*</option>
                            <option value="bfs">BFS</option>
                            <option value="dfs">DFS</option>
                            <option value="bellmanFord">Bellman-Ford</option>
                            <option value="bidirectional">Bidirectional</option>

                        </select>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center justify-center">
                        <div className="flex items-center gap-2">
                            <select
                                className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={mazeType}
                                onChange={(e) => setMazeType(e.target.value)}
                                disabled={isRunning || isGenerating}
                            >
                                <option value={MAZE_TYPES.BACKTRACKING}>Backtracking Maze</option>
                                <option value={MAZE_TYPES.PRIMS}>Prim's Algorithm</option>
                                <option value={MAZE_TYPES.DIVISION}>Recursive Division</option>
                                <option value={MAZE_TYPES.SPIRAL}>Spiral Maze</option>
                                <option value={MAZE_TYPES.RANDOM}>Random Walls</option>
                                <option value={MAZE_TYPES.KRUSKAL}>Kruskal's</option>
                                <option value={MAZE_TYPES.ELLER}>Eller's</option>
                            </select>

                            <button
                                className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                                onClick={generateMazes}
                                disabled={isRunning || isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Mazes'}
                            </button>
                        </div>

                        <button
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            onClick={compareAlgorithms}
                            disabled={isRunning || isGenerating}
                        >
                            {isRunning ? 'Racing...' : 'Race Algorithms'}
                        </button>

                        <button
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            onClick={resetGrids}
                            disabled={isRunning || isGenerating}
                        >
                            Reset
                        </button>

                        <AudioControls />
                    </div>
                </div>

                {/* Additional Controls */}
                <div className="flex flex-col sm:flex-row justify-between gap-2 p-2 bg-white rounded-lg shadow-sm mb-2">
                    <div className="flex flex-wrap gap-2 items-center justify-center">
                        <button
                            className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                            onClick={copyMazeLeftToRight}
                            disabled={isRunning || isGenerating}
                        >
                            Copy Left → Right
                        </button>

                        <button
                            className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                            onClick={copyMazeRightToLeft}
                            disabled={isRunning || isGenerating}
                        >
                            Copy Right → Left
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="syncWalls"
                            checked={syncWalls}
                            onChange={() => setSyncWalls(!syncWalls)}
                            disabled={isRunning || isGenerating}
                            className="rounded text-blue-500 focus:ring-blue-500"
                        />
                        <label htmlFor="syncWalls" className="text-sm text-gray-700">
                            Sync Wall Placement
                        </label>
                    </div>
                </div>

                {/* Winner Banner */}
                {winner && (
                    <div className={`text-center p-2 mb-2 rounded-lg font-bold ${
                        winner === 'left'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : winner === 'right'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                        {winner === 'tie'
                            ? 'It\'s a tie! Both algorithms found paths of the same length.'
                            : `${winner === 'left' ? algorithmLeft : algorithmRight} wins!`}
                    </div>
                )}

                {/* Stats & Legend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <Stats
                        algorithm={algorithmLeft}
                        nodesVisited={statsLeft.nodesVisited}
                        pathLength={statsLeft.pathLength}
                        executionTime={statsLeft.executionTime}
                        memoryUsed={statsLeft.memoryUsed}
                        manhattanDistance={statsLeft.manhattanDistance}
                        isRunning={isRunning}
                    />
                    <Stats
                        algorithm={algorithmRight}
                        nodesVisited={statsRight.nodesVisited}
                        pathLength={statsRight.pathLength}
                        executionTime={statsRight.executionTime}
                        memoryUsed={statsRight.memoryUsed}
                        manhattanDistance={statsRight.manhattanDistance}
                        isRunning={isRunning}
                    />
                </div>

                <Legend speed={speed} onSpeedChange={handleSpeedChange} />

                {/* Grid Section - Fixed with consistent spacing and size constraints */}
                <div className="flex-1 overflow-auto min-h-0 p-2">
                    <div className={`flex ${isLandscape ? 'flex-row justify-between' : 'flex-col'} items-center`}>
                        <div
                            className={`${isLandscape ? 'w-[46%]' : 'w-full mb-4'} ${winner === 'left' ? 'border-2 border-green-500 rounded-lg' : ''}`}
                            style={{ maxWidth: isLandscape ? 'calc(46vw - 2rem)' : 'none' }}
                        >
                            <Grid
                                grid={gridLeft}
                                onMouseDown={handleMouseDownLeft}
                                onMouseEnter={handleMouseEnterLeft}
                                onMouseUp={handleMouseUp}
                                isLandscape={isLandscape}
                            />
                        </div>
                        <div
                            className={`${isLandscape ? 'w-[46%]' : 'w-full'} ${winner === 'right' ? 'border-2 border-blue-500 rounded-lg' : ''}`}
                            style={{ maxWidth: isLandscape ? 'calc(46vw - 2rem)' : 'none' }}
                        >
                            <Grid
                                grid={gridRight}
                                onMouseDown={handleMouseDownRight}
                                onMouseEnter={handleMouseEnterRight}
                                onMouseUp={handleMouseUp}
                                isLandscape={isLandscape}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CompetitionVisualizer;