// Legend.jsx
import React from 'react';

const Legend = ({ speed, onSpeedChange }) => {
    const legendItems = [
        { color: '#22c55e', label: 'Start' },
        { color: '#ef4444', label: 'End' },
        { color: '#1f2937', label: 'Wall' },
        { color: '#60a5fa', label: 'Visited' },
        { color: '#facc15', label: 'Path' },
    ];

    return (
        <div className="flex items-center justify-center gap-6 mb-4 p-2 bg-white rounded-lg shadow-sm">
            {legendItems.map((item, index) => (
                <div key={item.label} className="flex items-center gap-2">
                    <div
                        style={{ width: '16px', height: '16px', backgroundColor: item.color }}
                        className="rounded-sm"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                </div>
            ))}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Speed:</span>
                <select
                    className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={speed}
                    onChange={(e) => onSpeedChange(e.target.value)}
                >
                    <option value="veryfast">Very Fast</option>
                    <option value="fast">Fast</option>
                    <option value="normal">Normal</option>
                    <option value="slow">Slow</option>
                </select>
            </div>
        </div>
    );
};

export default Legend;