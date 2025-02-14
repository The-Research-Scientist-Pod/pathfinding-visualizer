// utils/algorithmStats.js
import { GRID_SETTINGS } from './gridUtils';

export const calculateManhattanDistance = (startNode, finishNode) => {
    // Make sure we have valid nodes
    if (!startNode || !finishNode) return 0;

    // Calculate Manhattan distance
    const rowDistance = Math.abs(finishNode.row - startNode.row);
    const colDistance = Math.abs(finishNode.col - startNode.col);

    console.log('Manhattan Distance Calculation:', {
        start: { row: startNode.row, col: startNode.col },
        finish: { row: finishNode.row, col: finishNode.col },
        distance: rowDistance + colDistance
    });

    return rowDistance + colDistance;
};

export const createStatsTracker = (grid) => {
    const tracker = {
        startTime: performance.now(),
        memoryPeak: 0,
        nodesVisited: new Set(),
    };

    return {
        trackVisit: (node, currentMemory) => {
            tracker.nodesVisited.add(`${node.row},${node.col}`);
            tracker.memoryPeak = Math.max(tracker.memoryPeak, currentMemory);
        },

        getFinalStats: (pathNodes, startNode, finishNode) => {
            const endTime = performance.now();
            const executionTime = endTime - tracker.startTime;
            const manhattanDistance = calculateManhattanDistance(startNode, finishNode);

            return {
                nodesVisited: tracker.nodesVisited.size,
                pathLength: pathNodes.length > 0 ? pathNodes.length - 1 : 0,
                executionTime: Math.round(executionTime),
                memoryUsed: tracker.memoryPeak,
                manhattanDistance
            };
        }
    };
};

export const getNodesInShortestPath = (finishNode) => {
    const nodesInShortestPath = [];
    let currentNode = finishNode;
    while (currentNode !== null) {
        nodesInShortestPath.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }
    return nodesInShortestPath;
};