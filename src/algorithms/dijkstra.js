// algorithms/dijkstra.js
import { GRID_SETTINGS } from '../utils/gridUtils';
import { createStatsTracker, getNodesInShortestPath } from '../utils/algorithmStats';

export const dijkstra = async (grid, animateNode) => {
    const startNode = grid[GRID_SETTINGS.START_NODE_ROW][GRID_SETTINGS.START_NODE_COL];
    const finishNode = grid[GRID_SETTINGS.FINISH_NODE_ROW][GRID_SETTINGS.FINISH_NODE_COL];

    console.log('Starting Dijkstra with:', {
        startPosition: { row: startNode.row, col: startNode.col },
        finishPosition: { row: finishNode.row, col: finishNode.col }
    });

    const visitedNodesInOrder = [];
    const statsTracker = createStatsTracker(grid);

    startNode.distance = 0;
    const unvisitedNodes = getAllNodes(grid);

    while (unvisitedNodes.length) {
        sortNodesByDistance(unvisitedNodes);
        const closestNode = unvisitedNodes.shift();

        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) {
            // No path found
            return {
                visitedNodesInOrder,
                stats: statsTracker.getFinalStats([], startNode, finishNode)
            };
        }

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);
        statsTracker.trackVisit(closestNode, unvisitedNodes.length);
        await animateNode(closestNode);

        if (closestNode === finishNode) {
            const pathNodes = getNodesInShortestPath(finishNode);
            console.log('Path found:', {
                pathLength: pathNodes.length,
                startNode: { row: startNode.row, col: startNode.col },
                finishNode: { row: finishNode.row, col: finishNode.col }
            });
            return {
                visitedNodesInOrder,
                stats: statsTracker.getFinalStats(pathNodes, startNode, finishNode)
            };
        }

        updateUnvisitedNeighbors(closestNode, grid);
    }

    return {
        visitedNodesInOrder,
        stats: statsTracker.getFinalStats([], startNode, finishNode)
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

const sortNodesByDistance = (unvisitedNodes) => {
    unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
};

const updateUnvisitedNeighbors = (node, grid) => {
    const neighbors = getUnvisitedNeighbors(node, grid);
    for (const neighbor of neighbors) {
        neighbor.distance = node.distance + 1;
        neighbor.previousNode = node;
    }
};

const getUnvisitedNeighbors = (node, grid) => {
    const neighbors = [];
    const { row, col } = node;

    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);

    return neighbors.filter(neighbor => !neighbor.isVisited);
};