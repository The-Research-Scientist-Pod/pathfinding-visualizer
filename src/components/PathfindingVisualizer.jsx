// PathfindingVisualizer.jsx
import React, { useState, useCallback } from 'react';
import { getInitialGrid, getNewGridWithWallToggled, getNodesInShortestPath } from '../utils/gridUtils';
import { dijkstra } from '../algorithms/dijkstra';
import { astar } from '../algorithms/astar';
import {
  MAZE_TYPES,
  recursiveDivision,
  recursiveDivisionVertical,
  recursiveDivisionHorizontal,
  basicRandomMaze,
  circularMaze
} from '../utils/mazeGenerators';
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
  const [mazeType, setMazeType] = useState(MAZE_TYPES.RECURSIVE_DIVISION);

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
    for (const node of nodesInPath) {
      await new Promise(resolve => {
        setTimeout(() => {
          setGrid(grid => {
            const newGrid = grid.map(row => [...row]);
            newGrid[node.row][node.col] = {
              ...newGrid[node.row][node.col],
              isPath: true,
            };
            return newGrid;
          });
          resolve();
        }, 60);
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
      switch (mazeType) {
        case MAZE_TYPES.RECURSIVE_DIVISION:
          await recursiveDivision(grid, setGrid, setIsGenerating);
          break;
        case MAZE_TYPES.RECURSIVE_VERTICAL:
          await recursiveDivisionVertical(grid, setGrid, setIsGenerating);
          break;
        case MAZE_TYPES.RECURSIVE_HORIZONTAL:
          await recursiveDivisionHorizontal(grid, setGrid, setIsGenerating);
          break;
        case MAZE_TYPES.BASIC_RANDOM:
          await basicRandomMaze(grid, setGrid, setIsGenerating);
          break;
        case MAZE_TYPES.CIRCULAR:
          await circularMaze(grid, setGrid, setIsGenerating);
          break;
        default:
          await recursiveDivision(grid, setGrid, setIsGenerating);
      }
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
      const visitedNodesInOrder = await (algorithm === 'dijkstra'
          ? dijkstra(grid, animateNode)
          : astar(grid, animateNode));

      if (visitedNodesInOrder.length > 0) {
        await animatePath(visitedNodesInOrder, getNodesInShortestPath(grid[10][25]));
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
              <option value="astar">A* Algorithm</option>
            </select>

            <select
                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={mazeType}
                onChange={(e) => setMazeType(e.target.value)}
                disabled={isRunning || isGenerating}
            >
              <option value={MAZE_TYPES.RECURSIVE_DIVISION}>Recursive Division</option>
              <option value={MAZE_TYPES.RECURSIVE_VERTICAL}>Recursive Division (Vertical)</option>
              <option value={MAZE_TYPES.RECURSIVE_HORIZONTAL}>Recursive Division (Horizontal)</option>
              <option value={MAZE_TYPES.BASIC_RANDOM}>Basic Random Maze</option>
              <option value={MAZE_TYPES.CIRCULAR}>Circular Maze</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={generateMaze}
                disabled={isRunning || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Maze'}
            </button>

            <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={visualize}
                disabled={isRunning || isGenerating}
            >
              {isRunning ? 'Visualizing...' : 'Visualize Pathfinding'}
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
