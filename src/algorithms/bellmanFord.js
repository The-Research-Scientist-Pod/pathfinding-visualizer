// algorithms/bellmanFord.js
import { GRID_SETTINGS } from '../utils/gridUtils';
import { createStatsTracker } from '../utils/algorithmStats';

export const bellmanFord = async (grid, animateNode) => {
    const startNode = grid[GRID_SETTINGS.START_NODE_ROW][GRID_SETTINGS.START_NODE_COL];
    const finishNode = grid[GRID_SETTINGS.FINISH_NODE_ROW][GRID_SETTINGS.FINISH_NODE_COL];
    const visitedNodesInOrder = [];

    // Create stats tracker
    const statsTracker = createStatsTracker(grid);

    // Initialize distances
    const distances = new Map();
    const previous = new Map();
    const nodes = getAllNodes(grid);

    for (const node of nodes) {
        const key = `${node.row},${node.col}`;
        distances.set(key, Infinity);
        previous.set(key, null);
    }

    distances.set(`${startNode.row},${startNode.col}`, 0);

    // Bellman-Ford algorithm
    for (let i = 0; i < nodes.length - 1; i++) {
        let hasChanges = false;

        for (const node of nodes) {
            if (node.isWall) continue;

            const nodeKey = `${node.row},${node.col}`;
            const currentDistance = distances.get(nodeKey);

            const neighbors = getUnvisitedNeighbors(node, grid);
            for (const neighbor of neighbors) {
                if (neighbor.isWall) continue;

                const neighborKey = `${neighbor.row},${neighbor.col}`;
                const weight = 1; // Using uniform weight
                const newDistance = currentDistance + weight;

                if (newDistance < distances.get(neighborKey)) {
                    distances.set(neighborKey, newDistance);
                    previous.set(neighborKey, node);
                    hasChanges = true;

                    neighbor.previousNode = node;
                    neighbor.isVisited = true;
                    visitedNodesInOrder.push(neighbor);

                    // Track memory usage (size of distances and previous maps)
                    statsTracker.trackVisit(neighbor, distances.size + previous.size);
                    await animateNode(neighbor);
                }
            }
        }

        if (!hasChanges) break;
    }

    // Check for negative cycles (not typically needed with uniform weights)
    for (const node of nodes) {
        if (node.isWall) continue;

        const nodeKey = `${node.row},${node.col}`;
        const currentDistance = distances.get(nodeKey);

        const neighbors = getUnvisitedNeighbors(node, grid);
        for (const neighbor of neighbors) {
            if (neighbor.isWall) continue;

            const neighborKey = `${neighbor.row},${neighbor.col}`;
            const weight = 1;

            if (currentDistance + weight < distances.get(neighborKey)) {
                console.warn('Negative weight cycle detected');
                return {
                    visitedNodesInOrder,
                    stats: statsTracker.getFinalStats([], startNode, finishNode)
                };
            }
        }
    }

    const pathNodes = getNodesInShortestPath(finishNode);
    return {
        visitedNodesInOrder,
        stats: statsTracker.getFinalStats(pathNodes, startNode, finishNode)
    };
};

const getAllNodes = (grid) => {
    const nodes = [];
    for (const row of grid) {
        for (const node of row) {
            nodes.push(node);
        }
    }
    return nodes;
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