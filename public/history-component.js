
// History Component with Advanced Management Features
// Features: Filtering, Pinning, Status Tracking, Comparison

const HistoryView = ({ user, onBack, onViewIdea }) => {
    const [history, setHistory] = React.useState([]);
    const [filteredHistory, setFilteredHistory] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // State for Features
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all'); // all, todo, in-progress, done
    const [pinnedIds, setPinnedIds] = React.useState([]);
    const [projectStatuses, setProjectStatuses] = React.useState({}); // { ideaId: 'todo' | 'in-progress' | 'done' }
    const [compareMode, setCompareMode] = React.useState(false);
    const [selectedForCompare, setSelectedForCompare] = React.useState([]);

    // Load Data
    React.useEffect(() => {
        const loadHistory = async () => {
            // 1. Load Pinned & Status from LocalStorage (Mocking Backend Persistance)
            const savedPinned = JSON.parse(localStorage.getItem(`pideas_pinned_${user.uid}`) || '[]');
            setPinnedIds(savedPinned);
            const savedStatus = JSON.parse(localStorage.getItem(`pideas_status_${user.uid}`) || '{}');
            setProjectStatuses(savedStatus);

            if (typeof firebase === 'undefined') {
                setIsLoading(false);
                return;
            }

            try {
                const functions = firebase.functions();
                const getUserHistory = functions.httpsCallable('getUserHistory');
                const result = await getUserHistory({ userId: user.uid });

                if (result.data.success) {
                    setHistory(result.data.history);
                    setFilteredHistory(result.data.history);
                }
            } catch (error) {
                console.error('Error loading history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    // Filter Logic
    React.useEffect(() => {
        let result = [...history];

        // 1. Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(item => {
                const title = getProjectTitle(item).toLowerCase();
                const idea = (item.idea || '').toLowerCase();
                return title.includes(lowerTerm) || idea.includes(lowerTerm);
            });
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(item => {
                const status = projectStatuses[item.id] || 'todo';
                return status === statusFilter;
            });
        }

        // 3. Sort by Pinned (Pinned first, then date)
        result.sort((a, b) => {
            const isAPinned = pinnedIds.includes(a.id);
            const isBPinned = pinnedIds.includes(b.id);
            if (isAPinned && !isBPinned) return -1;
            if (!isAPinned && isBPinned) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        setFilteredHistory(result);
    }, [history, searchTerm, statusFilter, pinnedIds, projectStatuses]);


    // Actions
    const togglePin = (e, id) => {
        e.stopPropagation();
        let newPinned;
        if (pinnedIds.includes(id)) {
            newPinned = pinnedIds.filter(pid => pid !== id);
        } else {
            newPinned = [...pinnedIds, id];
        }
        setPinnedIds(newPinned);
        localStorage.setItem(`pideas_pinned_${user.uid}`, JSON.stringify(newPinned));
    };

    const updateStatus = (e, id, status) => {
        e.stopPropagation();
        const newStatuses = { ...projectStatuses, [id]: status };
        setProjectStatuses(newStatuses);
        localStorage.setItem(`pideas_status_${user.uid}`, JSON.stringify(newStatuses));
    };

    const toggleCompareSelection = (e, id) => {
        e.stopPropagation();
        if (selectedForCompare.includes(id)) {
            setSelectedForCompare(selectedForCompare.filter(sid => sid !== id));
        } else {
            if (selectedForCompare.length < 2) {
                setSelectedForCompare([...selectedForCompare, id]);
            }
        }
    };


    // Helpers
    const getProjectTitle = (item) => {
        if (!item.idea || typeof item.idea !== 'string') {
            const titleMatch = item.query.match(/for:\s*["']([^"']+)["']/i);
            if (titleMatch) return titleMatch[1];
            return item.query.length > 50 ? item.query.substring(0, 50) + '...' : item.query;
        }
        const lines = item.idea.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        for (const line of lines) {
            // Skip generic headers
            if (line.match(/^#+\s*PROJECT TITLE/i)) continue;

            // If line starts with header chars, strip them
            let cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();

            // If result is empty or just "Project Title" again, skip
            if (!cleanLine || cleanLine.match(/^PROJECT TITLE$/i)) continue;

            return cleanLine;
        }
        return "Untitled Project";
    };

    const getPreviewText = (item) => {
        if (!item.idea) return "Click to view details.";
        return item.idea.replace(/#+\s.*$/mg, '').replace(/\n+/g, ' ').trim().substring(0, 100) + '...';
    };


    // Render
    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-gray-400">Loading your journey...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Project History</h2>
                    <p className="text-gray-400">Manage and track your generated ideas</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setCompareMode(!compareMode);
                            setSelectedForCompare([]);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all border ${compareMode
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        {compareMode ? 'Cancel Compare' : '⚖️ Compare Ideas'}
                    </button>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all border border-gray-700/50"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Completed</option>
                </select>
            </div>

            {/* Comparison Modal Trigger */}
            {compareMode && selectedForCompare.length === 2 && (
                <div className="fixed bottom-8 right-8 z-50 animate-bounce">
                    <button
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-full shadow-2xl flex items-center gap-2"
                        onClick={() => alert("Comparison Feature Prototype - Coming Soon!")}
                    >
                        ⚖️ Compare Selected (2)
                    </button>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHistory.map((item) => {
                    const isPinned = pinnedIds.includes(item.id);
                    const status = projectStatuses[item.id] || 'todo';
                    const isSelected = selectedForCompare.includes(item.id);

                    return (
                        <div
                            key={item.id}
                            onClick={() => compareMode ? toggleCompareSelection(null, item.id) : onViewIdea(item)}
                            className={`group relative bg-gray-900/40 backdrop-blur-sm border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl
                                ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-800/50 hover:border-gray-700'}
                            `}
                        >
                            {/* Pin Button */}
                            <button
                                onClick={(e) => togglePin(e, item.id)}
                                className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-colors ${isPinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-600 hover:text-gray-300'
                                    }`}
                                title={isPinned ? "Unpin" : "Pin to top"}
                            >
                                📌
                            </button>

                            {/* Status Dropdown (Stop Propagation) */}
                            <div className="absolute top-3 left-3 z-10">
                                <select
                                    value={status}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateStatus(e, item.id, e.target.value)}
                                    className={`text-xs font-bold uppercase py-1 px-2 rounded-lg border-0 cursor-pointer outline-none appearance-none
                                        ${status === 'done' ? 'bg-green-900/80 text-green-400' :
                                            status === 'in-progress' ? 'bg-blue-900/80 text-blue-400' :
                                                'bg-gray-800/80 text-gray-500'}    
                                    `}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">Building</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>

                            <div className="p-6 pt-12">
                                <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                                    {getProjectTitle(item)}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-3 mb-4 min-h-[4rem]">
                                    {getPreviewText(item)}
                                </p>

                                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-800 pt-4">
                                    <div className="flex items-center gap-2">
                                        <span>{new Date(item.timestamp || item.generatedAt).toLocaleDateString()}</span>
                                        {item.codebaseDownloadUrl && (
                                            <a
                                                href={item.codebaseDownloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-1 text-green-400 hover:text-green-300 font-bold bg-green-900/20 px-2 py-0.5 rounded border border-green-900/50"
                                            >
                                                <span>⬇️ Code</span>
                                            </a>
                                        )}
                                    </div>
                                    <span className="flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                                        View Details →
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredHistory.length === 0 && (
                <div className="text-center py-20 bg-gray-900/20 border border-gray-800/50 rounded-2xl border-dashed">
                    <div className="text-4xl mb-4">🔍</div>
                    <div className="text-gray-400 font-medium">No projects found matching your filters.</div>
                    <button
                        onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                        className="text-blue-400 text-sm mt-2 hover:underline"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
};
