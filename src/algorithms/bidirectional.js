import { GRID_SETTINGS } from '../utils/gridUtils';
import { createStatsTracker } from '../utils/algorithmStats';

export const bidirectionalSearch = async (grid, animateNode) => {
    // Get start and finish nodes
    const startNode = grid[GRID_SETTINGS.START_NODE_ROW][GRID_SETTINGS.START_NODE_COL];
    const finishNode = grid[GRID_SETTINGS.FINISH_NODE_ROW][GRID_SETTINGS.FINISH_NODE_COL];

    // Track visited nodes for animation
    const visitedNodesInOrder = [];

    // Create stats tracker
    const statsTracker = createStatsTracker(grid);

    // Initialize BFS queues
    const forwardQueue = [startNode];
    const backwardQueue = [finishNode];

    // Track visited nodes using sets of keys
    const forwardVisited = new Set([`${startNode.row},${startNode.col}`]);
    const backwardVisited = new Set([`${finishNode.row},${finishNode.col}`]);

    // Store parent relationships for each direction
    const forwardParent = new Map();
    const backwardParent = new Map();

    // Clear previous node pointers and reset distances for all nodes
    for (const row of grid) {
        for (const node of row) {
            node.previousNode = null;
            node.distance = Infinity;
            node.isVisited = false;
        }
    }

    // Set initial distances for start and finish nodes
    startNode.distance = 0;
    finishNode.distance = 0;

    // Main search loop - break when we find a meeting point or one queue is empty
    let meetingNode = null;

    while (forwardQueue.length > 0 && backwardQueue.length > 0 && !meetingNode) {
        // Process one node from the forward search
        meetingNode = await processNextNode(
            forwardQueue,
            forwardVisited,
            backwardVisited,
            forwardParent,
            grid,
            visitedNodesInOrder,
            animateNode,
            statsTracker,
            true
        );

        if (meetingNode) break;

        // Process one node from the backward search
        meetingNode = await processNextNode(
            backwardQueue,
            backwardVisited,
            forwardVisited,
            backwardParent,
            grid,
            visitedNodesInOrder,
            animateNode,
            statsTracker,
            false
        );
    }

    // If a meeting point was found, construct the final path
    if (meetingNode) {
        // Build path from start to meeting point
        const pathFromStart = [];
        let current = meetingNode;
        while (current && current !== startNode) {
            pathFromStart.unshift(current);
            const key = `${current.row},${current.col}`;
            current = forwardParent.get(key);
        }
        pathFromStart.unshift(startNode);

        // Build path from meeting point to finish
        const pathFromMeeting = [];
        current = meetingNode;
        while (current && current !== finishNode) {
            // For the backward path, include the meeting node only once
            if (current !== meetingNode) {
                pathFromMeeting.push(current);
            }
            const key = `${current.row},${current.col}`;
            current = backwardParent.get(key);
        }
        pathFromMeeting.push(finishNode);

        // Merge both halves without slicing away any needed node
        const completePath = [...pathFromStart, ...pathFromMeeting];

        // Set up the previousNode chain in reverse so that each node points to its predecessor
        for (let i = completePath.length - 1; i > 0; i--) {
            completePath[i].previousNode = completePath[i - 1];
        }
        completePath[0].previousNode = null;

        // Get the nodes in the shortest path for statistics
        const nodesInShortestPath = getNodesInShortestPath(finishNode);

        return {
            visitedNodesInOrder,
            stats: statsTracker.getFinalStats(nodesInShortestPath, startNode, finishNode)
        };
    }

    // If no path was found, return visited nodes and empty stats for the path
    return {
        visitedNodesInOrder,
        stats: statsTracker.getFinalStats([], startNode, finishNode)
    };
};

// Process the next node in the current search direction
const processNextNode = async (
    queue,
    visited,
    otherVisited,
    parentMap,
    grid,
    visitedNodesInOrder,
    animateNode,
    statsTracker,
    isForward
) => {
    // Get the next node from the queue
    const currentNode = queue.shift();

    // Skip walls
    if (currentNode.isWall) return null;

    // Animate and mark as visited if not already done
    if (!currentNode.isVisited) {
        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);
        await animateNode(currentNode);
    }

    // Update stats with current queue size plus number of visited nodes
    statsTracker.trackVisit(currentNode, queue.length + visited.size);

    // Check for meeting point
    const currentKey = `${currentNode.row},${currentNode.col}`;
    if (otherVisited.has(currentKey)) {
        return currentNode; // Meeting point found
    }

    // Process all neighbors of the current node
    const neighbors = getNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.row},${neighbor.col}`;

        // Skip if neighbor has been visited in this search or is a wall
        if (visited.has(neighborKey) || neighbor.isWall) continue;

        visited.add(neighborKey);

        // Update neighbor's distance and record the parent relationship
        neighbor.distance = currentNode.distance + 1;
        parentMap.set(neighborKey, currentNode);

        // Add neighbor to the queue for further exploration
        queue.push(neighbor);
    }

    return null;
};

// Get the valid neighbors (up, down, left, right) of a given node
const getNeighbors = (node, grid) => {
    const neighbors = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
    return neighbors;
};

// Retrieve the nodes that form the shortest path by following previousNode pointers from finishNode
const getNodesInShortestPath = (finishNode) => {
    const nodesInShortestPath = [];
    let currentNode = finishNode;
    while (currentNode !== null) {
        nodesInShortestPath.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }
    return nodesInShortestPath;
};
