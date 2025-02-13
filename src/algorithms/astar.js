import { GRID_SETTINGS } from '../utils/gridUtils';

const getNeighbors = (node, grid) => {
    const neighbors = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
    return neighbors;
};

const heuristic = (nodeA, nodeB) => {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

export const astar = async (grid, animateNode) => {
    const startNode = grid[GRID_SETTINGS.START_NODE_ROW][GRID_SETTINGS.START_NODE_COL];
    const finishNode = grid[GRID_SETTINGS.FINISH_NODE_ROW][GRID_SETTINGS.FINISH_NODE_COL];

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

        if (current === finishNode) return visitedNodesInOrder;

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

    return visitedNodesInOrder;
};