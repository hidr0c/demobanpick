'use client';

import React from 'react';

type RandomCountSelectorProps = {
    randomCount: number;
    fixedCount: number;
    onRandomCountChange: (count: number) => void;
    maxTotal?: number;
    minTotal?: number;
};

const RandomCountSelector: React.FC<RandomCountSelectorProps> = ({
    randomCount,
    fixedCount,
    onRandomCountChange,
    maxTotal = 6,
    minTotal = 4
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const totalSongs = randomCount + fixedCount;
    const maxRandom = maxTotal - fixedCount;
    const minRandom = Math.max(0, minTotal - fixedCount);

    const handleIncrement = () => {
        if (randomCount < maxRandom && totalSongs < maxTotal) {
            onRandomCountChange(randomCount + 1);
        }
    };

    const handleDecrement = () => {
        if (randomCount > minRandom && totalSongs > minTotal) {
            onRandomCountChange(randomCount - 1);
        }
    };

    return (
        <div className="fixed top-8 left-0 z-50 flex items-start">
            {/* Slide Panel */}
            <div
                className="bg-gray-900 rounded-r-lg shadow-2xl overflow-hidden"
                style={{
                    width: isOpen ? '280px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    transition: 'width 0.3s ease-out, opacity 0.2s ease-out',
                }}
            >
                {isOpen && (
                    <div className="p-4">
                        {/* Header */}
                        <h3 className="font-bold text-lg text-white mb-4">Song Count Settings</h3>
                        
                        {/* Random Count */}
                        <div className="mb-4">
                            <label className="text-gray-400 text-sm block mb-2">Random Songs</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDecrement}
                                    disabled={randomCount <= minRandom || totalSongs <= minTotal}
                                    className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold text-xl"
                                >
                                    -
                                </button>
                                <span className="text-white text-2xl font-bold w-12 text-center">
                                    {randomCount}
                                </span>
                                <button
                                    onClick={handleIncrement}
                                    disabled={randomCount >= maxRandom || totalSongs >= maxTotal}
                                    className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold text-xl"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Fixed Count Display */}
                        <div className="mb-4">
                            <label className="text-gray-400 text-sm block mb-2">Fixed Songs</label>
                            <span className="text-white text-2xl font-bold">{fixedCount}</span>
                        </div>

                        {/* Total */}
                        <div className="pt-4 border-t border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Total:</span>
                                <span className={`text-xl font-bold ${
                                    totalSongs >= minTotal && totalSongs <= maxTotal 
                                        ? 'text-green-400' 
                                        : 'text-red-400'
                                }`}>
                                    {totalSongs} / {maxTotal}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Min: {minTotal} songs, Max: {maxTotal} songs
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Arrow Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-r-lg hover:bg-white/30"
                style={{
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
            >
                <svg
                    className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.8)"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Overlay to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 -z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default RandomCountSelector;
