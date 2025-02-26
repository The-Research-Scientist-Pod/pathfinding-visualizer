import React, { useState, useCallback, useEffect } from 'react';
import { getInitialGrid, getNewGridWithWallToggled, getNodesInShortestPath, GRID_SETTINGS } from '../utils/gridUtils';
import { dijkstra } from '../algorithms/dijkstra';
import { astar } from '../algorithms/astar';
import { breadthFirstSearch } from '../algorithms/breadthFirst';
import { depthFirstSearch } from '../algorithms/depthFirst';
import { bellmanFord } from '../algorithms/bellmanFord';
import { getMazeGenerator, MAZE_TYPES } from '../utils/mazeGenerators';
import Grid from './Grid';
import Legend from './Legend';
import Stats from './Stats';
import  audioService  from '../utils/AudioService';
import AudioControls from './AudioControls';

const PathfindingVisualizer = () => {
  // Orientation detection
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  // Basic state
  const [grid, setGrid] = useState(() => getInitialGrid());
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [speed, setSpeed] = useState('normal');
  const [mazeType, setMazeType] = useState(MAZE_TYPES.BACKTRACKING);
  const [stats, setStats] = useState({
    algorithm: 'dijkstra',
    nodesVisited: 0,
    pathLength: 0,
    executionTime: 0,
    memoryUsed: 0,
    pathEfficiency: 0,
    manhattanDistance: 0
  });

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

  // Mouse event handlers
  const handleMouseDown = (row, col) => {
    if (isRunning || isGenerating) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);

    // Play sound when a wall is added or removed
    const isWallNow = newGrid[row][col].isWall;
    audioService.play(isWallNow ? 'wallAdd' : 'wallRemove');

    setGrid(newGrid);
    setIsMousePressed(true);
  };

  const handleMouseEnter = (row, col) => {
    if (!isMousePressed || isRunning || isGenerating) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);

    // Play sound for wall placement, but only if the state is actually changing
    if (grid[row][col].isWall !== newGrid[row][col].isWall) {
      const isWallNow = newGrid[row][col].isWall;
      audioService.play(isWallNow ? 'wallAdd' : 'wallRemove');
    }

    setGrid(newGrid);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
  };

  // Animation functions
  const animateNode = async (node) => {
    const { visit } = getAnimationDelays();
    return new Promise(resolve => {
      setTimeout(() => {
        setGrid(grid => {
          const newGrid = grid.map(row => [...row]);
          newGrid[node.row][node.col] = {
            ...newGrid[node.row][node.col],
            isVisited: true,
          };
          return newGrid;
        });

        // Play position-based sound for each visited node
        audioService.playVisitSound(node.row, node.col, GRID_SETTINGS.COLS);

        resolve();
      }, visit);
    });
  };

  const animatePath = async (visitedNodesInOrder, nodesInPath) => {
    const { path } = getAnimationDelays();
    for (let i = 0; i < nodesInPath.length; i += 3) {
      await new Promise(resolve => {
        setTimeout(() => {
          setGrid(grid => {
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

          // Play path sound based on the progress through the path
          audioService.playPathSound(i, nodesInPath.length);

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

  const resetGrid = useCallback(() => {
    if (isRunning || isGenerating) return;
    audioService.play('reset');
    setGrid(getInitialGrid());
    setStats({
      algorithm: algorithm,
      nodesVisited: 0,
      pathLength: 0,
      executionTime: 0,
      memoryUsed: 0,
      pathEfficiency: 0,
      manhattanDistance: 0
    });
  }, [isRunning, isGenerating, algorithm]);

  const clearPath = () => {
    if (isRunning || isGenerating) return;
    audioService.play('click');
    setGrid(grid =>
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
  };

  const generateMaze = async () => {
    if (isRunning || isGenerating) return;
    audioService.play('click');
    setGrid(getInitialGrid());
    setIsGenerating(true);
    try {
      const mazeGenerator = getMazeGenerator(mazeType);
      await mazeGenerator(grid, setGrid);
    } catch (error) {
      console.error('Error generating maze:', error);
      audioService.play('failure');
    } finally {
      setIsGenerating(false);
      audioService.play('success');
    }
  };

  const getAlgorithmFunction = (algorithm) => {
    switch (algorithm) {
      case 'dijkstra': return dijkstra;
      case 'astar': return astar;
      case 'bfs': return breadthFirstSearch;
      case 'dfs': return depthFirstSearch;
      case 'bellmanFord': return bellmanFord;
      default: return dijkstra;
    }
  };

  const visualize = async () => {
    if (isRunning || isGenerating) return;
    clearPath();
    audioService.play('click');
    setIsRunning(true);

    try {
      const algorithmFunction = getAlgorithmFunction(algorithm);
      const result = await algorithmFunction(grid, animateNode);
      const { visitedNodesInOrder, stats: newStats } = result;
      setStats({ ...newStats, algorithm });

      if (visitedNodesInOrder.length > 0) {
        const { FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        const path = getNodesInShortestPath(grid[FINISH_NODE_ROW][FINISH_NODE_COL]);

        await animatePath(
            visitedNodesInOrder,
            path
        );

        // Play success sound if path was found, failure sound if not
        if (path.length > 0) {
          audioService.play('success');
        } else {
          audioService.play('failure');
        }
      } else {
        audioService.play('failure');
      }
    } catch (error) {
      console.error('Error during visualization:', error);
      audioService.play('failure');
    } finally {
      setIsRunning(false);
    }
  };

  return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 container mx-auto px-2 py-2 flex flex-col">
          {/* Controls Section */}
          <div className={`flex ${isLandscape ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 p-2 bg-white rounded-lg shadow-sm mb-2`}>
            <select
                className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                disabled={isRunning || isGenerating}
            >
              <option value="dijkstra">Dijkstra's</option>
              <option value="astar">A*</option>
              <option value="bfs">BFS</option>
              <option value="dfs">DFS</option>
              <option value="bellmanFord">Bellman-Ford</option>
            </select>

            <div className="flex items-center gap-2">
              <select
                  className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mazeType}
                  onChange={(e) => setMazeType(e.target.value)}
                  disabled={isRunning || isGenerating}
              >
                <option value={MAZE_TYPES.BACKTRACKING}>Backtracking</option>
                <option value={MAZE_TYPES.PRIMS}>Prim's</option>
                <option value={MAZE_TYPES.DIVISION}>Division</option>
                <option value={MAZE_TYPES.SPIRAL}>Spiral</option>
                <option value={MAZE_TYPES.RANDOM}>Random</option>
                <option value={MAZE_TYPES.KRUSKAL}>Kruskal's</option>
                <option value={MAZE_TYPES.ELLER}>Eller's</option>


              </select>

              <button
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                  onClick={generateMaze}
                  disabled={isRunning || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Maze'}
              </button>
            </div>

            <button
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={visualize}
                disabled={isRunning || isGenerating}
            >
              {isRunning ? 'Finding...' : 'Find Path'}
            </button>

            <button
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                onClick={resetGrid}
                disabled={isRunning || isGenerating}
            >
              Reset
            </button>

            <AudioControls />
          </div>

          {/* Stats Section */}
          <Stats
              algorithm={stats.algorithm}
              nodesVisited={stats.nodesVisited}
              pathLength={stats.pathLength}
              executionTime={stats.executionTime}
              memoryUsed={stats.memoryUsed}
              manhattanDistance={stats.manhattanDistance}
              isRunning={isRunning}
          />

          {/* Legend Section */}
          <Legend speed={speed} onSpeedChange={handleSpeedChange} />

          {/* Grid Section */}
          <div className={`flex justify-center ${isLandscape ? 'w-full' : 'h-full'}`}>
            <Grid
                grid={grid}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
                isLandscape={isLandscape}
            />
          </div>
        </main>
      </div>
  );
};

export default PathfindingVisualizer;