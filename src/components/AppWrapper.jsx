import React, { useState } from 'react';
import PathfindingVisualizer from './PathfindingVisualizer';
import CompetitionVisualizer from './CompetitionVisualizer';

const AppWrapper = () => {
    const [mode, setMode] = useState('single'); // 'single' or 'competition'

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-gray-800 text-white p-4">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-2xl font-bold mb-2 sm:mb-0">Pathfinding Visualizer</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm">Mode:</span>
                        <select
                            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                        >
                            <option value="single">Single Algorithm</option>
                            <option value="competition">Algorithm Competition</option>
                        </select>
                    </div>
                </div>
            </header>

            {mode === 'single' ? <PathfindingVisualizer /> : <CompetitionVisualizer />}

            <footer className="bg-gray-800 text-white p-2 text-center text-sm">
                <div className="container mx-auto">
                    <p>Compare different pathfinding algorithms in action</p>
                </div>
            </footer>
        </div>
    );
};

export default AppWrapper;