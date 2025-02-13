// algorithms/bellmanFord.js
import {
    getUnvisitedNeighbors,
    getAllNodes,
    getStartNode,
    getFinishNode,
    getKeyFromNode
} from '../utils/algorithmHelpers';

export const bellmanFord = async (grid, animateNode) => {
    const startNode = getStartNode(grid);
    const finishNode = getFinishNode(grid);
    const visitedNodesInOrder = [];

    // Initialize distances
    const distances = new Map();
    const previous = new Map();
    const nodes = getAllNodes(grid);

    for (const node of nodes) {
        const key = getKeyFromNode(node);
        distances.set(key, Infinity);
        previous.set(key, null);
    }

    distances.set(getKeyFromNode(startNode), 0);

    // Bellman-Ford algorithm
    for (let i = 0; i < nodes.length - 1; i++) {
        let hasChanges = false;

        for (const node of nodes) {
            if (node.isWall) continue;

            const nodeKey = getKeyFromNode(node);
            const currentDistance = distances.get(nodeKey);

            const neighbors = getUnvisitedNeighbors(node, grid);
            for (const neighbor of neighbors) {
                if (neighbor.isWall) continue;

                const neighborKey = getKeyFromNode(neighbor);
                const weight = 1; // Using uniform weight for all edges
                const newDistance = currentDistance + weight;

                if (newDistance < distances.get(neighborKey)) {
                    distances.set(neighborKey, newDistance);
                    previous.set(neighborKey, node);
                    hasChanges = true;

                    neighbor.previousNode = node;
                    neighbor.isVisited = true;
                    visitedNodesInOrder.push(neighbor);
                    await animateNode(neighbor);
                }
            }
        }

        if (!hasChanges) break;
    }

    // Check for negative weight cycles
    for (const node of nodes) {
        if (node.isWall) continue;

        const nodeKey = getKeyFromNode(node);
        const currentDistance = distances.get(nodeKey);

        const neighbors = getUnvisitedNeighbors(node, grid);
        for (const neighbor of neighbors) {
            if (neighbor.isWall) continue;

            const neighborKey = getKeyFromNode(neighbor);
            const weight = 1;

            if (currentDistance + weight < distances.get(neighborKey)) {
                console.warn('Negative weight cycle detected');
                return visitedNodesInOrder;
            }
        }
    }

    return visitedNodesInOrder;
};