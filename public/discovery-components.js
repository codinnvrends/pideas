const { useState, useEffect } = React;

// 1. Visual Branching: Card Component for Options
const DiscoveryStepCard = ({ option, isSelected, onClick, theme }) => {
    return (
        <div
            onClick={onClick}
            className={`
                relative p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105
                border-2 flex flex-col items-center justify-center gap-3 text-center h-full
                ${isSelected
                    ? 'bg-purple-900/40 border-purple-500 shadow-lg shadow-purple-900/20'
                    : 'bg-zinc-800/40 border-zinc-700/50 hover:border-purple-500/50 hover:bg-zinc-800/60'}
            `}
        >
            {isSelected && (
                <div className="absolute top-2 right-2 text-purple-400 animate-pulse">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
            )}

            <div className="text-4xl mb-2 transform transition-transform duration-300 group-hover:scale-110">
                {option.icon || '✨'}
            </div>

            <div className={`font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {option.label}
            </div>

            {option.description && (
                <div className="text-xs text-gray-400">
                    {option.description}
                </div>
            )}
        </div>
    );
};

// 2. Progress "Journey Map"
const DiscoveryJourneyMap = ({ steps, currentStep, theme }) => {
    return (
        <div className="w-full mb-8 overflow-x-auto pb-12 no-scrollbar">
            <div className="flex items-center justify-between min-w-max relative px-8 gap-8">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-800 z-0"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-0 transition-all duration-500"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                            <div
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                                    ${isCompleted
                                        ? 'bg-purple-600 border-purple-600 text-white'
                                        : isCurrent
                                            ? 'bg-black border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-125'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-600'}
                                `}
                            >
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            <span className={`
                                text-xs font-medium whitespace-nowrap absolute -bottom-6 transition-colors duration-300
                                ${isCurrent ? 'text-purple-400' : isCompleted ? 'text-gray-300' : 'text-gray-600'}
                            `}>
                                {step.shortTitle || step.id}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 3. Shuffle / Feeling Lucky Button
const DiscoveryShuffleButton = ({ onShuffle, theme }) => {
    return (
        <button
            onClick={onShuffle}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-900/20 text-purple-300 hover:bg-purple-900/40 hover:scale-105 transition-all duration-300 text-sm font-medium group"
        >
            <span className="group-hover:rotate-180 transition-transform duration-500">🎲</span>
            Shuffle / Feeling Lucky
        </button>
    );
};

// Export components
window.DiscoveryComponents = {
    DiscoveryStepCard,
    DiscoveryJourneyMap,
    DiscoveryShuffleButton
};
