// algorithms/breadthFirst.js
import { GRID_SETTINGS } from '../utils/gridUtils';
import { createStatsTracker } from '../utils/algorithmStats';

export const breadthFirstSearch = async (grid, animateNode) => {
    const startNode = grid[GRID_SETTINGS.START_NODE_ROW][GRID_SETTINGS.START_NODE_COL];
    const finishNode = grid[GRID_SETTINGS.FINISH_NODE_ROW][GRID_SETTINGS.FINISH_NODE_COL];
    const visitedNodesInOrder = [];

    // Create stats tracker
    const statsTracker = createStatsTracker(grid);

    const queue = [startNode];
    const visited = new Set();

    while (queue.length > 0) {
        const currentNode = queue.shift();
        const key = `${currentNode.row},${currentNode.col}`;

        if (visited.has(key)) continue;
        visited.add(key);

        // Track current memory usage (size of queue + visited set)
        statsTracker.trackVisit(currentNode, queue.length + visited.size);

        if (currentNode.isWall) continue;

        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);
        await animateNode(currentNode);

        if (currentNode === finishNode) {
            const pathNodes = getNodesInShortestPath(finishNode);
            return {
                visitedNodesInOrder,
                stats: statsTracker.getFinalStats(pathNodes, startNode, finishNode)
            };
        }

        const neighbors = getUnvisitedNeighbors(currentNode, grid);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            if (!visited.has(neighborKey)) {
                neighbor.previousNode = currentNode;
                queue.push(neighbor);
            }
        }
    }

    // If no path is found
    return {
        visitedNodesInOrder,
        stats: statsTracker.getFinalStats([], startNode, finishNode)
    };
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