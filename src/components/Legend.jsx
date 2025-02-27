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
        <div className="mb-2 p-1 bg-white rounded-lg shadow-sm">
            {/* First row - legend items in a wrap container */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-1">
                {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-1">
                        <div
                            style={{ width: '12px', height: '12px', backgroundColor: item.color }}
                            className="rounded-sm"
                        />
                        <span className="text-xs sm:text-sm text-gray-700">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Second row - speed selector */}
            <div className="flex items-center justify-center">
                <span className="text-xs sm:text-sm text-gray-700 mr-1">Speed:</span>
                <select
                    className="px-1 py-0.5 text-xs sm:text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
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