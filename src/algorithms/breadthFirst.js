// algorithms/breadthFirst.js
import {
    getUnvisitedNeighbors,
    getStartNode,
    getFinishNode,
    getKeyFromNode
} from '../utils/algorithmHelpers';

export const breadthFirstSearch = async (grid, animateNode) => {
    const startNode = getStartNode(grid);
    const finishNode = getFinishNode(grid);
    const visitedNodesInOrder = [];
    const queue = [startNode];
    const visited = new Set();

    while (queue.length > 0) {
        const currentNode = queue.shift();
        const key = getKeyFromNode(currentNode);

        if (visited.has(key)) continue;
        visited.add(key);

        if (currentNode.isWall) continue;

        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);
        await animateNode(currentNode);

        if (currentNode === finishNode) {
            return visitedNodesInOrder;
        }

        const neighbors = getUnvisitedNeighbors(currentNode, grid);
        for (const neighbor of neighbors) {
            if (!visited.has(getKeyFromNode(neighbor))) {
                neighbor.previousNode = currentNode;
                queue.push(neighbor);
            }
        }
    }

    return visitedNodesInOrder;
};