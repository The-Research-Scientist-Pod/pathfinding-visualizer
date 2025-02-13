// utils/algorithmHelpers.js
import { GRID_SETTINGS } from './gridUtils';

export const getUnvisitedNeighbors = (node, grid) => {
    const neighbors = [];
    const { row, col } = node;
    const directions = [
        [-1, 0],  // up
        [1, 0],   // down
        [0, -1],  // left
        [0, 1]    // right
    ];

    for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (
            newRow >= 0 && newRow < grid.length &&
            newCol >= 0 && newCol < grid[0].length
        ) {
            neighbors.push(grid[newRow][newCol]);
        }
    }

    return neighbors;
};

export const getAllNodes = (grid) => {
    return grid.reduce((nodes, row) => nodes.concat(row), []);
};

export const sortNodesByDistance = (unvisitedNodes) => {
    unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
};

export const getStartNode = (grid) => {
    return grid[GRID_SETTINGS.START_NODE_ROW][GRID_SETTINGS.START_NODE_COL];
};

export const getFinishNode = (grid) => {
    return grid[GRID_SETTINGS.FINISH_NODE_ROW][GRID_SETTINGS.FINISH_NODE_COL];
};

export const heuristic = (nodeA, nodeB) => {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

export const getKeyFromNode = (node) => {
    return `${node.row},${node.col}`;
};