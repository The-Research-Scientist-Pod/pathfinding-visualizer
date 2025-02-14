import React, { useState, useCallback, useEffect } from 'react';
import { getInitialGrid, getNewGridWithWallToggled, getNodesInShortestPath, GRID_SETTINGS } from '../utils/gridUtils';
import { dijkstra } from '../algorithms/dijkstra';
import { astar } from '../algorithms/astar';
import { breadthFirstSearch } from '../algorithms/breadthFirst';
import { depthFirstSearch } from '../algorithms/depthFirst';
import { bellmanFord } from '../algorithms/bellmanFord';
import { backtrackingMaze } from '../utils/mazeGenerators';
import Grid from './Grid';

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
    setGrid(newGrid);
    setIsMousePressed(true);
  };

  const handleMouseEnter = (row, col) => {
    if (!isMousePressed || isRunning || isGenerating) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);
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
          resolve();
        }, path);
      });
    }
  };

  // Grid manipulation functions
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
  };

  const resetGrid = useCallback(() => {
    if (isRunning || isGenerating) return;
    setGrid(getInitialGrid());
    setStats({
      algorithm: 'dijkstra',
      nodesVisited: 0,
      pathLength: 0,
      executionTime: 0,
      memoryUsed: 0,
      pathEfficiency: 0,
      manhattanDistance: 0
    });
  }, [isRunning, isGenerating]);

  const clearPath = () => {
    if (isRunning || isGenerating) return;
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
    setGrid(getInitialGrid());
    try {
      await backtrackingMaze(grid, setGrid, setIsGenerating);
    } catch (error) {
      console.error('Error generating maze:', error);
      setIsGenerating(false);
    }
  };

  const visualize = async () => {
    if (isRunning || isGenerating) return;
    clearPath();
    setIsRunning(true);

    try {
      let result;
      switch (algorithm) {
        case 'dijkstra':
          result = await dijkstra(grid, animateNode);
          break;
        case 'astar':
          result = await astar(grid, animateNode);
          break;
        case 'bfs':
          result = await breadthFirstSearch(grid, animateNode);
          break;
        case 'dfs':
          result = await depthFirstSearch(grid, animateNode);
          break;
        case 'bellmanFord':
          result = await bellmanFord(grid, animateNode);
          break;
        default:
          result = await dijkstra(grid, animateNode);
      }

      const { visitedNodesInOrder, stats: newStats } = result;
      setStats({ ...newStats, algorithm });

      if (visitedNodesInOrder.length > 0) {
        const { FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        await animatePath(
            visitedNodesInOrder,
            getNodesInShortestPath(grid[FINISH_NODE_ROW][FINISH_NODE_COL])
        );
      }
    } catch (error) {
      console.error('Error during visualization:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className={`flex-1 container mx-auto px-2 py-2 flex flex-col ${isLandscape ? 'landscape' : 'portrait'}`}>
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

            <button
                className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                onClick={generateMaze}
                disabled={isRunning || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Maze'}
            </button>

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
          </div>

          {/* Stats Section */}
          <div className={`flex ${isLandscape ? 'flex-row' : 'flex-nowrap overflow-x-auto'} items-center justify-start gap-4 p-2 bg-white rounded-lg shadow-sm mb-2`}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Algorithm:</span>
              <span className="text-sm font-medium">
              {stats.algorithm === 'dijkstra' ? "Dijkstra's" :
                  stats.algorithm === 'astar' ? "A*" :
                      stats.algorithm === 'bfs' ? "BFS" :
                          stats.algorithm === 'dfs' ? "DFS" :
                              "Bellman-Ford"}
            </span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Nodes:</span>
              <span className="text-sm font-medium">{isRunning ? "..." : stats.nodesVisited || 0}</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Path:</span>
              <span className="text-sm font-medium">{isRunning ? "..." : stats.pathLength || 0}</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Time:</span>
              <span className="text-sm font-medium">{isRunning ? "..." : `${stats.executionTime || 0}ms`}</span>
            </div>
          </div>

          {/* Legend Section */}
          <div className="flex flex-wrap items-center justify-center gap-4 p-2 bg-white rounded-lg shadow-sm mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-sm" />
              <span className="text-sm text-gray-700">Start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-sm" />
              <span className="text-sm text-gray-700">End</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-900 rounded-sm" />
              <span className="text-sm text-gray-700">Wall</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded-sm" />
              <span className="text-sm text-gray-700">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
              <span className="text-sm text-gray-700">Path</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Speed:</span>
              <select
                  className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={speed}
                  onChange={(e) => handleSpeedChange(e.target.value)}
                  disabled={isRunning || isGenerating}
              >
                <option value="veryfast">Very Fast</option>
                <option value="fast">Fast</option>
                <option value="normal">Normal</option>
                <option value="slow">Slow</option>
              </select>
            </div>
          </div>

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