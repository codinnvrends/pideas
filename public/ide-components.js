// Code Generation Loading Screen
const CodeGenerationLoadingScreen = ({ operationId, theme }) => {
    const [status, setStatus] = useState('STARTING');
    const [logs, setLogs] = useState([]);
    const [factIndex, setFactIndex] = useState(0);

    const facts = [
        "React's Virtual DOM improves performance by minimizing direct DOM manipulation.",
        "Python's name is derived from the British comedy group Monty Python.",
        "Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.",
        "Firebase Firestore scales automatically to handle millions of concurrent users.",
        "Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces.",
        "CrewAI uses role-playing agents to solve complex tasks autonomously.",
        "Good documentation (README) is key to a successful open-source project.",
        "Modular code architecture ensures easier maintenance and scalability."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex(prev => (prev + 1) % facts.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!operationId) return;

        const unsubscribe = firebase.firestore()
            .collection('operations')
            .doc(operationId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    setStatus(data.status || 'STARTING');
                    if (data.logs) {
                        setLogs(data.logs);
                    }
                }
            });

        return () => unsubscribe();
    }, [operationId]);

    // Auto-scroll logs
    const logsEndRef = useRef(null);
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const getStatusStep = () => {
        switch (status) {
            case 'STARTING': return 1;
            case 'DISTILLING': return 2;
            case 'AI_GENERATION': return 3;
            case 'PROCESSING': return 4;
            case 'UPLOADING': return 5;
            case 'COMPLETED': return 6;
            default: return 1;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className={`w-full max-w-4xl p-8 rounded-2xl shadow-2xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Constructing Your Codebase
                    </h2>
                    <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        Our AI Crew is architecting, coding, and documenting your project.
                    </p>
                </div>

                {/* Architecture Visual / Progress Steps */}
                <div className="flex justify-between items-center mb-12 px-12 relative">
                    {/* Progress Bar Background */}
                    <div className="absolute left-12 right-12 h-1 bg-gray-700 top-1/2 -z-10"></div>

                    {['Init', 'Blueprint', 'AI Coding', 'Processing', 'Packaging', 'Done'].map((step, idx) => {
                        const isActive = idx + 1 <= getStatusStep();
                        const isCurrent = idx + 1 === getStatusStep();
                        return (
                            <div key={idx} className="flex flex-col items-center gap-2 bg-gray-900 p-2 rounded-lg">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${isActive ? 'bg-blue-600 text-white scale-110' : 'bg-gray-800 text-gray-500'
                                    } ${isCurrent ? 'ring-4 ring-blue-500/30' : ''}`}>
                                    {isActive ? '✓' : idx + 1}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? (theme === 'light' ? 'text-gray-900' : 'text-white') : 'text-gray-500'}`}>
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Live Terminal */}
                    <div className={`rounded-xl overflow-hidden border ${theme === 'light' ? 'bg-gray-900 border-gray-800' : 'bg-black border-gray-800'}`}>
                        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="ml-2 text-xs text-gray-400 font-mono">build_log.txt</span>
                        </div>
                        <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-2">
                            {logs.map((log, i) => (
                                <div key={i} className="text-green-400">
                                    <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                            {status !== 'COMPLETED' && (
                                <div className="text-blue-400 animate-pulse">_</div>
                            )}
                        </div>
                    </div>

                    {/* Engagement / Did You Know */}
                    <div className="flex flex-col justify-center">
                        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-blue-50 border-blue-100' : 'bg-gray-800 border-gray-700'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">💡</span>
                                <h3 className={`font-bold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>Did You Know?</h3>
                            </div>
                            <p className={`text-lg leading-relaxed min-h-[5rem] transition-opacity duration-500 ${theme === 'light' ? 'text-blue-800' : 'text-gray-300'}`}>
                                {facts[factIndex]}
                            </p>
                            <div className="mt-4 flex justify-between items-center text-xs text-blue-400/70">
                                <span>Tip #{factIndex + 1}</span>
                                <div className="flex gap-1">
                                    {facts.map((_, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === factIndex ? 'bg-blue-500' : 'bg-blue-500/20'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tech Stack Icons (Static for now, dynamic later) */}
                        <div className="mt-8 flex justify-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" className="w-10 h-10 object-contain" alt="React" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg" className="w-10 h-10 object-contain" alt="Python" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" className="w-10 h-10 object-contain" alt="TS" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Code Preview Browser Component
const CodePreviewBrowser = ({ previewUrl, downloadUrl, theme, onClose }) => {
    const [fileTree, setFileTree] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedFolders, setExpandedFolders] = useState({});

    // Fetch Preview JSON
    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const response = await fetch(previewUrl);
                const data = await response.json();
                setFileTree(data);
                // Auto select first file
                if (data && data.length > 0) {
                    // Find first file (bfs)
                    const findFirstFile = (nodes) => {
                        for (const node of nodes) {
                            if (node.type === 'file') return node;
                            if (node.children) {
                                const found = findFirstFile(node.children);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    const first = findFirstFile(data);
                    if (first) setSelectedFile(first);
                }
            } catch (error) {
                console.error("Failed to load preview:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPreview();
    }, [previewUrl]);

    const toggleFolder = (path) => {
        setExpandedFolders(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const renderTree = (nodes, depth = 0) => {
        return nodes.map((node) => (
            <div key={node.path} style={{ paddingLeft: `${depth * 12}px` }}>
                <div
                    className={`flex items-center gap-2 py-1 px-2 cursor-pointer rounded-md text-sm transition-colors ${selectedFile?.path === node.path
                            ? (theme === 'light' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-blue-900/40 text-blue-300 font-medium')
                            : (theme === 'light' ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-gray-800 text-gray-400')
                        }`}
                    onClick={() => {
                        if (node.type === 'directory') toggleFolder(node.path);
                        else setSelectedFile(node);
                    }}
                >
                    <span className="opacity-70 text-xs w-4 text-center">
                        {node.type === 'directory' ? (expandedFolders[node.path] ? '📂' : '📁') : '📄'}
                    </span>
                    <span className="truncate">{node.name}</span>
                </div>
                {node.type === 'directory' && expandedFolders[node.path] && (
                    <div>{renderTree(node.children, depth + 1)}</div>
                )}
            </div>
        ));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className={`w-full max-w-6xl h-[85vh] rounded-xl overflow-hidden shadow-2xl flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-[#1e1e1e]'}`}>
                {/* Header */}
                <div className={`h-16 px-6 flex items-center justify-between border-b ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800 bg-[#252526]'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            P
                        </div>
                        <div>
                            <h2 className={`font-bold ${theme === 'light' ? 'text-gray-900' : 'text-gray-200'}`}>Project Code Preview</h2>
                            <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Browse generated files before downloading</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={downloadUrl}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <span>💾</span> Download ZIP
                        </a>
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'light' ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-gray-700 text-gray-400'}`}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* File Explorer Sidebar */}
                    <div className={`w-64 flex-shrink-0 overflow-y-auto border-r p-2 ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800 bg-[#252526]'}`}>
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-gray-500">Loading tree...</div>
                        ) : (
                            renderTree(fileTree)
                        )}
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {selectedFile ? (
                            <>
                                <div className={`h-10 flex items-center px-4 border-b text-sm font-mono ${theme === 'light' ? 'bg-white border-gray-200 text-gray-600' : 'bg-[#1e1e1e] border-gray-800 text-gray-400'}`}>
                                    {selectedFile.path}
                                </div>
                                <div className={`flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed ${theme === 'light' ? 'bg-white text-gray-800' : 'bg-[#1e1e1e] text-gray-300'}`}>
                                    <pre>{selectedFile.content}</pre>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-gray-500">
                                <span className="text-4xl opacity-20">👋</span>
                                <p>Select a file to view content</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
