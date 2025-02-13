// algorithms/depthFirst.js
import {
    getUnvisitedNeighbors,
    getStartNode,
    getFinishNode,
    getKeyFromNode
} from '../utils/algorithmHelpers';

export const depthFirstSearch = async (grid, animateNode) => {
    const startNode = getStartNode(grid);
    const finishNode = getFinishNode(grid);
    const visitedNodesInOrder = [];
    const stack = [startNode];
    const visited = new Set();

    while (stack.length > 0) {
        const currentNode = stack.pop();
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

        const neighbors = getUnvisitedNeighbors(currentNode, grid).reverse();
        for (const neighbor of neighbors) {
            if (!visited.has(getKeyFromNode(neighbor))) {
                neighbor.previousNode = currentNode;
                stack.push(neighbor);
            }
        }
    }

    return visitedNodesInOrder;
};
