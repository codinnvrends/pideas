
// History Component with Advanced Management Features
// Features: Filtering, Pinning, Status Tracking, Comparison

// Helper: Parse Project Idea into Structured Data
const parseProjectData = (ideaText, query) => {
    if (!ideaText) return null;

    // 1. Title
    let title = "Untitled Project";
    const titleMatch = query.match(/for:\s*["']([^"']+)["']/i);
    if (titleMatch) title = titleMatch[1];
    else {
        const lines = ideaText.split('\n').filter(l => l.trim());
        const firstHeader = lines.find(l => l.match(/^#+\s/));
        if (firstHeader) title = firstHeader.replace(/^#+\s/, '').replace(/\*\*/g, '').trim();
    }

    // 2. Overview (first paragraph)
    let overview = "";
    const sections = ideaText.split(/#+\s/);
    if (sections.length > 1) {
        overview = sections.find(s => s.toLowerCase().includes('overview') || s.toLowerCase().includes('introduction')) || sections[0];
        overview = overview.replace(/overview|introduction/i, '').trim().substring(0, 150) + "...";
    }

    // 3. Tech Stack
    let techStack = [];
    const techSection = sections.find(s => s.toLowerCase().includes('technolog') || s.toLowerCase().includes('stack'));
    if (techSection) {
        techStack = techSection.split('\n')
            .filter(l => l.trim().match(/^[-*]\s/))
            .map(l => l.replace(/^[-*]\s/, '').trim())
            .slice(0, 5);
    }

    // 4. Features
    let features = [];
    const featureSection = sections.find(s => s.toLowerCase().includes('feature') || s.toLowerCase().includes('functionality'));
    if (featureSection) {
        features = featureSection.split('\n')
            .filter(l => l.trim().match(/^[-*]\s/))
            .map(l => l.replace(/^[-*]\s/, '').trim())
            .slice(0, 4);
    }

    // 5. Complexity (Heuristic)
    let complexity = "Medium";
    if (ideaText.length > 5000) complexity = "High";
    if (ideaText.match(/microservices|distributed|AI model/i)) complexity = "Very High";
    if (ideaText.match(/static site|landing page|simple/i)) complexity = "Low";

    return { title, overview, techStack, features, complexity };
};

// Component: Comparison Modal
const ComparisonModal = ({ project1, project2, onClose }) => {
    const data1 = parseProjectData(project1.idea, project1.query);
    const data2 = parseProjectData(project2.idea, project2.query);

    if (!data1 || !data2) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl">⚖️</span> Project Comparison
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-auto p-0 grid grid-cols-2 divide-x divide-gray-800">
                    {/* Project A */}
                    <div className="p-8 space-y-8 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800/20">
                        <div>
                            <div className="text-sm font-bold text-blue-500 mb-2 uppercase tracking-wide">Project A</div>
                            <h3 className="text-3xl font-bold text-white mb-4">{data1.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">{data1.overview}</p>
                        </div>

                        <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-3">Complexity Estimate</div>
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold 
                                ${data1.complexity === 'High' || data1.complexity === 'Very High' ? 'bg-red-900/30 text-red-400' :
                                    data1.complexity === 'Low' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                {data1.complexity}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span>🛠️</span> Tech Stack
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {data1.techStack.length > 0 ? data1.techStack.map((tech, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-900/20 border border-blue-800/50 text-blue-300 rounded-lg text-sm">
                                        {tech}
                                    </span>
                                )) : <span className="text-gray-500 italic">No specific logic found.</span>}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span>✨</span> Key Features
                            </h4>
                            <ul className="space-y-2">
                                {data1.features.length > 0 ? data1.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                        <span className="text-green-500 mt-1">✓</span>
                                        {feat}
                                    </li>
                                )) : <span className="text-gray-500 italic">Standard features apply.</span>}
                            </ul>
                        </div>
                    </div>

                    {/* Project B */}
                    <div className="p-8 space-y-8 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800/20">
                        <div>
                            <div className="text-sm font-bold text-purple-500 mb-2 uppercase tracking-wide">Project B</div>
                            <h3 className="text-3xl font-bold text-white mb-4">{data2.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">{data2.overview}</p>
                        </div>

                        <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-3">Complexity Estimate</div>
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold 
                                ${data2.complexity === 'High' || data2.complexity === 'Very High' ? 'bg-red-900/30 text-red-400' :
                                    data2.complexity === 'Low' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                {data2.complexity}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span>🛠️</span> Tech Stack
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {data2.techStack.length > 0 ? data2.techStack.map((tech, i) => (
                                    <span key={i} className="px-3 py-1 bg-purple-900/20 border border-purple-800/50 text-purple-300 rounded-lg text-sm">
                                        {tech}
                                    </span>
                                )) : <span className="text-gray-500 italic">No specific logic found.</span>}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span>✨</span> Key Features
                            </h4>
                            <ul className="space-y-2">
                                {data2.features.length > 0 ? data2.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                        <span className="text-green-500 mt-1">✓</span>
                                        {feat}
                                    </li>
                                )) : <span className="text-gray-500 italic">Standard features apply.</span>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    const [showComparisonModal, setShowComparisonModal] = React.useState(false);

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
                        onClick={() => setShowComparisonModal(true)}
                    >
                        ⚖️ Compare Selected (2)
                    </button>
                </div>
            )}

            {/* Comparison Modal */}
            {showComparisonModal && selectedForCompare.length === 2 && (
                <ComparisonModal
                    project1={history.find(h => h.id === selectedForCompare[0])}
                    project2={history.find(h => h.id === selectedForCompare[1])}
                    onClose={() => setShowComparisonModal(false)}
                />
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
                            onClick={(e) => compareMode ? toggleCompareSelection(e, item.id) : onViewIdea(item)}
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
