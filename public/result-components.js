// Result Page Components (Workspaces)

// 1. Roadmap View (Mermaid Gantt Chart)
const RoadmapView = ({ idea, theme }) => {
    const containerRef = React.useRef(null);
    const [chartSyntax, setChartSyntax] = React.useState('');
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (window.mermaid) {
            window.mermaid.initialize({
                startOnLoad: false,
                theme: theme === 'light' ? 'default' : 'dark',
                securityLevel: 'loose',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            });
        }
    }, [theme]);

    React.useEffect(() => {
        generateGanttChart(idea);
    }, [idea]);

    React.useEffect(() => {
        if (chartSyntax && containerRef.current && window.mermaid) {
            renderChart();
        }
    }, [chartSyntax]);

    const generateGanttChart = (ideaText) => {
        try {
            // Simple parsing logic to extract phases
            // Looks for lines starting with "Phase X:" or "Week X:"
            const lines = ideaText.split('\n');
            const tasks = [];
            let currentPhase = '';

            lines.forEach(line => {
                const phaseMatch = line.match(/^(Phase|Week)\s*(\d+)[:\.]\s*(.+)/i);
                if (phaseMatch) {
                    const phaseNum = phaseMatch[2];
                    const phaseTitle = phaseMatch[3].trim();
                    // Estimate duration based on content or default to 1w
                    tasks.push({
                        section: `Phase ${phaseNum}`,
                        task: phaseTitle.substring(0, 30) + (phaseTitle.length > 30 ? '...' : ''), // Truncate
                        duration: '1w'
                    });
                }
            });

            if (tasks.length === 0) {
                // Fallback for demo purposes if no clear phases found
                tasks.push(
                    { section: 'Phase 1', task: 'Project Setup & Planning', duration: '3d' },
                    { section: 'Phase 1', task: 'Core Features Implementation', duration: '5d' },
                    { section: 'Phase 2', task: 'UI/UX Design & Polish', duration: '4d' },
                    { section: 'Phase 3', task: 'Testing & Deployment', duration: '3d' }
                );
            }

            // Build Mermaid Syntax
            let mermaidCode = `gantt\n    title Project Implementation Roadmap\n    dateFormat  YYYY-MM-DD\n    axisFormat  %W\n    excludes    weekends\n\n`;

            let startDate = new Date();
            let lastSection = '';

            tasks.forEach((t, i) => {
                const sectionHeader = t.section !== lastSection ? `    section ${t.section}\n` : '';
                lastSection = t.section;

                // Simple chaining: each task starts after the previous one
                // For the very first task, we use the calculated start date
                // For subsequent tasks, we use 'after taskID' logic or just sequential natural flow in Mermaid

                // To keep it robust, we'll just list them sequentially for now
                // Mermaid automatically sequences them if we don't specify start dates, based on duration

                mermaidCode += `${sectionHeader}    ${t.task} :${t.duration}\n`;
            });

            setChartSyntax(mermaidCode);
            setError(null);
        } catch (err) {
            console.error("Error generating roadmap:", err);
            setError("Could not generate a visual roadmap from this project plan.");
        }
    };

    const renderChart = async () => {
        try {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                const { svg } = await window.mermaid.render('mermaid-chart-' + Date.now(), chartSyntax);
                containerRef.current.innerHTML = svg;
            }
        } catch (err) {
            console.error("Mermaid render error:", err);
            // Don't show error UI, just fallback? or show generic error
            setError("Failed to render roadmap visualization.");
        }
    };

    return (
        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800/40 border-gray-700/50'}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    🚀 Interactive Roadmap
                </h3>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">Auto-Generated</span>
            </div>

            {error ? (
                <div className="text-center py-12 text-gray-500">
                    <p>{error}</p>
                    <p className="text-xs mt-2">Try clarifying the "Implementation Plan" section in your idea.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div ref={containerRef} className="min-w-[600px] flex justify-center"></div>
                </div>
            )}
        </div>
    );
};


// 2. Resource Hub
const ResourceHub = ({ idea, theme }) => {
    const [resources, setResources] = React.useState([]);

    React.useEffect(() => {
        extractResources(idea);
    }, [idea]);

    const extractResources = (ideaText) => {
        // Naive keyword extraction based on common tech stacks
        const keywords = [
            'React', 'Node.js', 'Python', 'Firebase', 'Django', 'Flask', 'Vue.js', 'Angular',
            'Swift', 'Kotlin', 'TensorFlow', 'PyTorch', 'AWS', 'Docker', 'Kubernetes', 'SQL',
            'MongoDB', 'Redis', 'GraphQL', 'TypeScript', 'Tailwind CSS', 'Bootstrap'
        ];

        const foundResources = [];

        keywords.forEach(tech => {
            if (ideaText.includes(tech)) {
                foundResources.push({
                    name: tech,
                    type: 'Topic',
                    links: [
                        { label: 'Official Docs', url: `https://www.google.com/search?q=${tech}+documentation&btnI=1` },
                        { label: 'YouTube Tutorials', url: `https://www.youtube.com/results?search_query=${tech}+tutorial` },
                        { label: 'Best Practices', url: `https://www.google.com/search?q=${tech}+best+practices` }
                    ],
                    icon: getTechIcon(tech)
                });
            }
        });

        // Dedup and set
        setResources(foundResources);
    };

    const getTechIcon = (tech) => {
        // Simplified icon mapping
        return '📚';
    };

    if (resources.length === 0) {
        return (
            <div className={`p-8 text-center rounded-xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800/40 border-gray-700/50'}`}>
                <p className="text-gray-500">No specific resources found for this project stack.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                📚 Learning Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((res, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-all hover:shadow-lg ${theme === 'light'
                            ? 'bg-white border-gray-200 hover:border-blue-300'
                            : 'bg-gray-800/60 border-gray-700 hover:border-blue-500/50'
                        }`}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{res.icon}</span>
                            <h4 className={`font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{res.name}</h4>
                        </div>
                        <div className="space-y-2">
                            {res.links.map((link, lIdx) => (
                                <a
                                    key={lIdx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between group ${theme === 'light'
                                            ? 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                            : 'bg-gray-900/50 text-gray-400 hover:bg-gray-700 hover:text-blue-400'
                                        }`}
                                >
                                    <span>{link.label}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 3. Simple Tab Navigation
const ResultTabNav = ({ activeTab, onTabChange, theme }) => {
    const tabs = [
        { id: 'plan', label: '📋 Project Plan' },
        { id: 'roadmap', label: '🚀 Roadmap' },
        { id: 'resources', label: '📚 Resources' }
    ];

    return (
        <div className={`flex border-b mb-6 ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === tab.id
                            ? (theme === 'light' ? 'text-blue-600' : 'text-blue-400')
                            : (theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200')
                        }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
                    )}
                </button>
            ))}
        </div>
    );
};

// Export components
window.ResultComponents = {
    RoadmapView,
    ResourceHub,
    ResultTabNav
};
