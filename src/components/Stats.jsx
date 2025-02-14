// components/Stats.jsx
const Stats = ({
                   algorithm,
                   nodesVisited,
                   pathLength,
                   executionTime,
                   memoryUsed,
                   manhattanDistance,
                   isRunning
               }) => {
    const formatAlgorithmName = (algo) => {
        switch(algo) {
            case 'dijkstra':
                return "Dijkstra's";
            case 'astar':
                return 'A* Search';
            case 'bfs':
                return 'Breadth First';
            case 'dfs':
                return 'Depth First';
            case 'bellmanFord':
                return 'Bellman-Ford';
            default:
                return algo;
        }
    };

    const isGuaranteedShortest = ['dijkstra', 'astar', 'bfs', 'bellmanFord'].includes(algorithm);

    return (
        <div className="flex items-center justify-center gap-6 p-2 bg-white rounded-lg shadow-sm mb-2">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Algorithm:</span>
                <span className="text-sm font-medium">{algorithm}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Nodes:</span>
                <span className="text-sm font-medium">{isRunning ? "..." : nodesVisited || 0}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Path:</span>
                <span className="text-sm font-medium">{isRunning ? "..." : pathLength || 0}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="text-sm font-medium">{isRunning ? "..." : `${executionTime || 0}ms`}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Memory:</span>
                <span className="text-sm font-medium">{isRunning ? "..." : `${memoryUsed || 0}`}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Manhattan:</span>
                <span className="text-sm font-medium">{isRunning ? "..." : manhattanDistance || 0}</span>
            </div>
        </div>
    );
};

export default Stats;