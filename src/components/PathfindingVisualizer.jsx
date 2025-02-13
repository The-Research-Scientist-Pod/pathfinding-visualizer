import React, { useState, useCallback } from 'react';
import { getInitialGrid, getNewGridWithWallToggled, getNodesInShortestPath, GRID_SETTINGS } from '../utils/gridUtils';
import { dijkstra } from '../algorithms/dijkstra';
import { astar } from '../algorithms/astar';
import { breadthFirstSearch } from '../algorithms/breadthFirst';
import { depthFirstSearch } from '../algorithms/depthFirst';
import { bellmanFord } from '../algorithms/bellmanFord';
import { MAZE_TYPES, backtrackingMaze } from '../utils/mazeGenerators';
import Grid from './Grid';
import Legend from './Legend';

const PathfindingVisualizer = () => {
  const [grid, setGrid] = useState(() => {
    const initialGrid = getInitialGrid();
    console.log('Initial grid created:', initialGrid);
    return initialGrid;
  });
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [algorithm, setAlgorithm] = useState('dijkstra');

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

  const animateNode = async (node) => {
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
      }, 30);
    });
  };

  const animatePath = async (visitedNodesInOrder, nodesInPath) => {
    // Batch nodes in groups of 3 for faster animation
    for (let i = 0; i < nodesInPath.length; i += 3) {
      await new Promise(resolve => {
        setTimeout(() => {
          setGrid(grid => {
            const newGrid = grid.map(row => [...row]);
            // Update multiple nodes at once
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
        }, 10); // Reduced from 60ms to 20ms
      });
    }
  };

  const resetGrid = useCallback(() => {
    if (isRunning || isGenerating) return;
    setGrid(getInitialGrid());
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
      let visitedNodesInOrder;

      switch (algorithm) {
        case 'dijkstra':
          visitedNodesInOrder = await dijkstra(grid, animateNode);
          break;
        case 'astar':
          visitedNodesInOrder = await astar(grid, animateNode);
          break;
        case 'bfs':
          visitedNodesInOrder = await breadthFirstSearch(grid, animateNode);
          break;
        case 'dfs':
          visitedNodesInOrder = await depthFirstSearch(grid, animateNode);
          break;
        case 'bellmanFord':
          visitedNodesInOrder = await bellmanFord(grid, animateNode);
          break;
        default:
          visitedNodesInOrder = await dijkstra(grid, animateNode);
      }

      if (visitedNodesInOrder.length > 0) {
        const { FINISH_NODE_ROW, FINISH_NODE_COL } = GRID_SETTINGS;
        await animatePath(visitedNodesInOrder, getNodesInShortestPath(grid[FINISH_NODE_ROW][FINISH_NODE_COL]));
      }
    } catch (error) {
      console.error('Error during visualization:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
      <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex gap-4">
            <select
                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                disabled={isRunning || isGenerating}
            >
              <option value="dijkstra">Dijkstra's Algorithm</option>
              <option value="astar">A* Search</option>
              <option value="bfs">Breadth First Search</option>
              <option value="dfs">Depth First Search</option>
              <option value="bellmanFord">Bellman-Ford</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={generateMaze}
                disabled={isRunning || isGenerating}
            >
              {isGenerating ? 'Generating Maze...' : 'Generate Maze'}
            </button>

            <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={visualize}
                disabled={isRunning || isGenerating}
            >
              {isRunning ? 'Finding Path...' : 'Find Path'}
            </button>

            <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={resetGrid}
                disabled={isRunning || isGenerating}
            >
              Reset Grid
            </button>
          </div>
        </div>

        <Legend />

        <Grid
            grid={grid}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseUp={handleMouseUp}
        />
      </div>
  );
};

export default PathfindingVisualizer;