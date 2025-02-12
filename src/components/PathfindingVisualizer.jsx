import React, { useState, useCallback } from 'react';

const PathfindingVisualizer = () => {
  const ROWS = 20;
  const COLS = 30;
  const START_NODE_ROW = 10;
  const START_NODE_COL = 5;
  const FINISH_NODE_ROW = 10;
  const FINISH_NODE_COL = 25;

  const createNode = (row, col) => {
    return {
      row,
      col,
      isStart: row === START_NODE_ROW && col === START_NODE_COL,
      isFinish: row === FINISH_NODE_ROW && col === FINISH_NODE_COL,
      distance: Infinity,
      isVisited: false,
      isWall: false,
      previousNode: null,
      isPath: false,
      f: Infinity,
      g: Infinity,
      h: Infinity,
    };
  };

  const getInitialGrid = () => {
    const grid = [];
    for (let row = 0; row < ROWS; row++) {
      const currentRow = [];
      for (let col = 0; col < COLS; col++) {
        currentRow.push(createNode(row, col));
      }
      grid.push(currentRow);
    }
    return grid;
  };

  const [grid, setGrid] = useState(() => {
    const initialGrid = getInitialGrid();
    console.log('Initial grid created:', initialGrid);
    return initialGrid;
  });
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState('dijkstra');

  const handleMouseDown = (row, col) => {
    if (isRunning) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);
    setGrid(newGrid);
    setIsMousePressed(true);
  };

  const handleMouseEnter = (row, col) => {
    if (!isMousePressed || isRunning) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);
    setGrid(newGrid);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
  };

  const getNewGridWithWallToggled = (grid, row, col) => {
    const newGrid = grid.map(row => [...row]);
    const node = newGrid[row][col];
    if (!node.isStart && !node.isFinish) {
      const newNode = {
        ...node,
        isWall: !node.isWall,
      };
      newGrid[row][col] = newNode;
    }
    return newGrid;
  };

  // Dijkstra's Algorithm
  const dijkstra = async () => {
    setIsRunning(true);
    const startNode = grid[START_NODE_ROW][START_NODE_COL];
    const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];

    const visitedNodesInOrder = [];
    startNode.distance = 0;
    const unvisitedNodes = getAllNodes(grid);

    while (unvisitedNodes.length) {
      sortNodesByDistance(unvisitedNodes);
      const closestNode = unvisitedNodes.shift();

      if (closestNode.isWall) continue;
      if (closestNode.distance === Infinity) {
        setIsRunning(false);
        return visitedNodesInOrder;
      }

      closestNode.isVisited = true;
      visitedNodesInOrder.push(closestNode);

      if (closestNode === finishNode) {
        await animatePath(visitedNodesInOrder, getNodesInShortestPath(finishNode));
        setIsRunning(false);
        return;
      }

      updateUnvisitedNeighbors(closestNode, grid);
      await animateNode(closestNode);
    }
    setIsRunning(false);
  };

  // A* Algorithm
  const astar = async () => {
    setIsRunning(true);
    const startNode = grid[START_NODE_ROW][START_NODE_COL];
    const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];

    const openSet = [startNode];
    const closedSet = new Set();
    const visitedNodesInOrder = [];

    startNode.g = 0;
    startNode.h = heuristic(startNode, finishNode);
    startNode.f = startNode.g + startNode.h;

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      if (current.isWall) continue;

      if (current === finishNode) {
        await animatePath(visitedNodesInOrder, getNodesInShortestPath(finishNode));
        setIsRunning(false);
        return;
      }

      closedSet.add(current);
      visitedNodesInOrder.push(current);
      current.isVisited = true;
      await animateNode(current);

      const neighbors = getNeighbors(current, grid);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor) || neighbor.isWall) continue;

        const tentativeG = current.g + 1;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.previousNode = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, finishNode);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }
    setIsRunning(false);
  };

  const heuristic = (nodeA, nodeB) => {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
  };

  const getNeighbors = (node, grid) => {
    const neighbors = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
    return neighbors;
  };

  const getAllNodes = (grid) => {
    return grid.reduce((acc, row) => acc.concat(row), []);
  };

  const sortNodesByDistance = (unvisitedNodes) => {
    unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
  };

  const updateUnvisitedNeighbors = (node, grid) => {
    const neighbors = getNeighbors(node, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        neighbor.distance = node.distance + 1;
        neighbor.previousNode = node;
      }
    }
  };

  const getNodesInShortestPath = (finishNode) => {
    const nodesInShortestPath = [];
    let currentNode = finishNode;
    while (currentNode !== null) {
      nodesInShortestPath.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }
    return nodesInShortestPath;
  };

  const animateNode = async (node) => {
    return new Promise(resolve => {
      setTimeout(() => {
        setGrid(grid => {
          const newGrid = grid.map(row => [...row]);
          const newNode = {
            ...newGrid[node.row][node.col],
            isVisited: true,
          };
          newGrid[node.row][node.col] = newNode;
          return newGrid;
        });
        resolve();
      }, 20);
    });
  };

  const animatePath = async (visitedNodesInOrder, nodesInPath) => {
    for (const node of nodesInPath) {
      await new Promise(resolve => {
        setTimeout(() => {
          setGrid(grid => {
            const newGrid = grid.map(row => [...row]);
            const newNode = {
              ...newGrid[node.row][node.col],
              isPath: true,
            };
            newGrid[node.row][node.col] = newNode;
            return newGrid;
          });
          resolve();
        }, 50);
      });
    }
  };

  const resetGrid = useCallback(() => {
    if (isRunning) return;
    setGrid(getInitialGrid());
  }, [isRunning]);

  const clearPath = () => {
    if (isRunning) return;
    const newGrid = grid.map(row =>
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
    );
    setGrid(newGrid);
  };

  const visualize = () => {
    clearPath(); // Only clear the path, not the walls
    setTimeout(() => {
      if (algorithm === 'dijkstra') {
        dijkstra();
      } else {
        astar();
      }
    }, 100);
  };

  return (
      <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
        <div className="mb-4 space-x-4">
          <select
              className="px-4 py-2 rounded border border-gray-300"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              disabled={isRunning}
          >
            <option value="dijkstra">Dijkstra's Algorithm</option>
            <option value="astar">A* Algorithm</option>
          </select>
          <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={visualize}
              disabled={isRunning}
          >
            Visualize Pathfinding
          </button>
          <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              onClick={resetGrid}
              disabled={isRunning}
          >
            Reset Grid
          </button>
        </div>

        <div className="text-sm mb-4 space-y-1">
          <p>Click and drag to create walls</p>
          <p>
            <span className="text-green-600">■</span> Start •
            <span className="text-red-600">■</span> End •
            <span className="text-gray-800">■</span> Wall •
            <span className="text-blue-400">■</span> Visited •
            <span className="text-yellow-400">■</span> Path
          </p>
        </div>

        {/* Test div to verify colors */}
        <div className="mb-4 flex gap-2">
          <div style={{ width: '32px', height: '32px', backgroundColor: '#22c55e' }}></div>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#ef4444' }}></div>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#1f2937' }}></div>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#60a5fa' }}></div>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#facc15' }}></div>
        </div>

        <div
            className="grid bg-gray-200 p-4 rounded shadow-lg border-2 border-gray-300"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, 30px)`,
              gap: '1px',
              backgroundColor: '#e5e7eb',
              padding: '8px',
              margin: '0 auto'
            }}
        >
          {grid.map((row, rowIdx) =>
              row.map((node, nodeIdx) => {
                const {
                  isStart,
                  isFinish,
                  isWall,
                  isVisited,
                  isPath,
                } = node;

                const extraClassName = isFinish
                    ? '#ef4444'  // red
                    : isStart
                        ? '#22c55e'  // green
                        : isWall
                            ? '#1f2937'  // gray
                            : isPath
                                ? '#facc15'  // yellow
                                : isVisited
                                    ? '#60a5fa'  // blue
                                    : '#ffffff';  // white

                return (
                    <div
                        key={`${rowIdx}-${nodeIdx}`}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.3s ease',
                          backgroundColor: extraClassName
                        }}
                        onMouseDown={() => handleMouseDown(rowIdx, nodeIdx)}
                        onMouseEnter={() => handleMouseEnter(rowIdx, nodeIdx)}
                        onMouseUp={handleMouseUp}
                    />
                );
              })
          )}
        </div>
      </div>
  );
};

export default PathfindingVisualizer;