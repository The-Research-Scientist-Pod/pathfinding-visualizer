// algorithms/astar.js
import { GRID_SETTINGS } from '../utils/gridUtils';
import { createStatsTracker } from '../utils/algorithmStats';

export const astar = async (grid, animateNode) => {
    const startNode = grid[GRID_SETTINGS.START_NODE_ROW][GRID_SETTINGS.START_NODE_COL];
    const finishNode = grid[GRID_SETTINGS.FINISH_NODE_ROW][GRID_SETTINGS.FINISH_NODE_COL];
    const visitedNodesInOrder = [];

    // Create stats tracker
    const statsTracker = createStatsTracker(grid);

    startNode.g = 0;
    startNode.h = heuristic(startNode, finishNode);
    startNode.f = startNode.g + startNode.h;

    const openSet = [startNode];
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        // Track current memory usage (size of openSet + closedSet)
        statsTracker.trackVisit(current, openSet.length + closedSet.size);

        if (current.isWall) continue;

        current.isVisited = true;
        visitedNodesInOrder.push(current);
        await animateNode(current);

        if (current === finishNode) {
            const pathNodes = getNodesInShortestPath(finishNode);
            return {
                visitedNodesInOrder,
                stats: statsTracker.getFinalStats(pathNodes, startNode, finishNode)
            };
        }

        closedSet.add(current);

        const neighbors = getUnvisitedNeighbors(current, grid);
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

    // If no path is found
    return {
        visitedNodesInOrder,
        stats: statsTracker.getFinalStats([], startNode, finishNode)
    };
};

const heuristic = (nodeA, nodeB) => {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

const getUnvisitedNeighbors = (node, grid) => {
    const neighbors = [];
    const { row, col } = node;

    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);

    return neighbors;
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