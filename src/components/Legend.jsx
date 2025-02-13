import React from 'react';

const Legend = () => {
    const legendItems = [
        { color: '#22c55e', label: 'Start' },
        { color: '#ef4444', label: 'End' },
        { color: '#1f2937', label: 'Wall' },
        { color: '#60a5fa', label: 'Visited' },
        { color: '#facc15', label: 'Path' },
    ];

    return (
        <div className="text-sm mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Legend</h2>
            <div className="inline-flex items-center gap-4 px-4 py-3 bg-white rounded-lg shadow-sm">
                {legendItems.map((item, index) => (
                    <React.Fragment key={item.label}>
                        {index > 0 && <div className="w-px h-4 bg-gray-200" />}
                        <div className="flex items-center gap-2">
                            <div
                                style={{ width: '20px', height: '20px', backgroundColor: item.color }}
                                className="rounded-sm"
                            />
                            <span className="text-gray-700">{item.label}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>
            <p className="mt-2 text-gray-600 text-sm">Click and drag to create walls</p>
        </div>
    );
};

export default Legend;