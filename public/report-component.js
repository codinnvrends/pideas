
const sanitizeMarkdown = (text) => {
    if (!text) return '';
    // 1. Replace literal "\n" strings (common in JSON responses) with actual newlines
    let cleanText = text.replace(/\\n/g, '\n');

    // 2. Ensure headers have a blank line before them (Markdown requirement)
    cleanText = cleanText.replace(/([^\n])\n(#+\s)/g, '$1\n\n$2');

    // 3. Ensure lists have a blank line before them
    cleanText = cleanText.replace(/([^\n])\n(\*|-|\d+\.)\s/g, '$1\n\n$2');

    return cleanText;
};

// Project Report Component (Thesis Generator)

const ProjectReportView = ({ idea, theme, userProfile, historyId, user, initialReport }) => {
    const [report, setReport] = React.useState(initialReport || null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [generatingStep, setGeneratingStep] = React.useState('');
    const [saveStatus, setSaveStatus] = React.useState('');

    // Animation steps for loading state
    const loadingSteps = [
        "Analyzing project scope...",
        "Reviewing academic literature...",
        "Designing system architecture...",
        "Drafting methodology...",
        "Simulating experimental results...",
        "Finalizing citations..."
    ];

    React.useEffect(() => {
        if (isLoading) {
            let stepIndex = 0;
            const interval = setInterval(() => {
                setGeneratingStep(loadingSteps[stepIndex % loadingSteps.length]);
                stepIndex++;
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const generateReport = firebase.functions().httpsCallable('generate_detailed_report');

            // Extract title and overview from idea text
            // Robust extraction: Try regex, then fallback to first line
            let title = "My Project";
            const titleMatch = idea.match(/#\s*(.*?)\n/);
            if (titleMatch) title = titleMatch[1].trim();
            else title = idea.split('\n')[0].replace(/#/g, '').trim();

            const overview = idea; // Send full idea context

            const result = await generateReport({
                projectTitle: title,
                projectOverview: overview,
                studentProfile: userProfile || {}
            });

            if (result.data.success) {
                const generatedReport = result.data.report;
                setReport(generatedReport);

                // Auto-save: Create history entry if missing, then save report
                if (user) {
                    setSaveStatus('Saving to history...');
                    try {
                        let targetHistoryId = historyId;

                        // 1. If we don't have a history ID, create a new entry first
                        if (!targetHistoryId) {
                            console.log("No history ID found, creating new entry for report...");
                            const saveIdeaToHistory = firebase.functions().httpsCallable('saveIdeaToHistory');

                            const saveResult = await saveIdeaToHistory({
                                userId: user.uid,
                                ideaData: {
                                    query: "Report Generation (Manual)",
                                    idea: idea, // The full idea text
                                    studentProfile: userProfile || {},
                                    gameScore: 0
                                },
                                gameSteps: []
                            });

                            if (saveResult.data.success) {
                                targetHistoryId = saveResult.data.historyId;
                                console.log("Created new history entry:", targetHistoryId);
                            }
                        }

                        // 2. Save the report to the history item
                        if (targetHistoryId) {
                            const updateHistory = firebase.functions().httpsCallable('updateProjectHistory');
                            await updateHistory({
                                userId: user.uid,
                                historyId: targetHistoryId,
                                data: { report: generatedReport }
                            });
                            setSaveStatus('Saved to history');
                            setTimeout(() => setSaveStatus(''), 3000);
                        } else {
                            throw new Error("Could not establish history ID");
                        }
                    } catch (saveErr) {
                        console.error("Failed to save report:", saveErr);
                        setSaveStatus('Failed to save');
                    }
                }
            } else {
                throw new Error(result.data.error || "Failed to generate report");
            }
        } catch (err) {
            console.error("Report generation error:", err);
            setError(err.message || "An error occurred while generating the report.");
        } finally {
            setIsLoading(false);
        }
    };

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">🎓</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{generatingStep}</h3>
                <p className="text-gray-400 max-w-md animate-pulse">
                    Our Academic Architect AI is writing your thesis blueprint.
                    <br />
                    <span className="text-xs text-gray-500 mt-2 block">(This takes about 30-45 seconds)</span>
                </p>
            </div>
        );
    }

    // 2. Preview State (Not Generated Yet)
    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full animate-fadeIn">
                <div className="max-w-3xl bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-10 shadow-2xl relative overflow-hidden group">

                    {/* Background glow effect */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-600/30 transition-all duration-1000"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-1000"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                            <span className="text-4xl text-white">📜</span>
                        </div>

                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4">
                            Comprehensive Project Report
                        </h2>

                        <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                            Turn your project idea into a <span className="text-purple-400 font-semibold">professional academic thesis</span>.
                            We'll generate a 6-chapter document complete with synthetic results and IEEE citations.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-xl mx-auto">
                            <div className="bg-black/40 p-4 rounded-lg border border-gray-700/50">
                                <span className="text-purple-400 font-bold block mb-1">Chapter 1-3</span>
                                <span className="text-gray-400 text-sm">Introduction, Literature Review, Methodology</span>
                            </div>
                            <div className="bg-black/40 p-4 rounded-lg border border-gray-700/50">
                                <span className="text-blue-400 font-bold block mb-1">Chapter 4-6</span>
                                <span className="text-gray-400 text-sm">Implementation, Synthetic Results, Conclusion</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            className="relative overflow-hidden group/btn px-10 py-4 bg-white text-black rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                ✨ Generate Academic Report
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                        </button>

                        {error && (
                            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm animate-shake">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 3. Result State (Report Viewer)
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50 relative animate-fadeIn">
            {/* Custom Styles for Print & Typography */}
            <style>{`
                @media print {
                    @page { margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; }
                }
                .report-content h1 { 
                    font-size: 2.5rem; font-weight: 800; color: #1a202c; 
                    border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 2rem; margin-top: 0;
                }
                .report-content h2 { 
                    font-size: 1.75rem; font-weight: 700; color: #2d3748; 
                    margin-top: 2.5rem; margin-bottom: 1rem; 
                    border-left: 4px solid #3182ce; padding-left: 1rem;
                }
                .report-content h3 { 
                    font-size: 1.25rem; font-weight: 600; color: #4a5568; 
                    margin-top: 1.5rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
                }
                .report-content p { 
                    margin-bottom: 1.25rem; line-height: 1.8; color: #4a5568;
                }
                .report-content ul, .report-content ol { 
                    margin-bottom: 1.25rem; padding-left: 1.5rem;
                }
                .report-content li { margin-bottom: 0.5rem; }
            `}</style>

            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-10 sticky top-0 print:hidden">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                        <h3 className="font-bold text-gray-900">Project Thesis</h3>
                        <p className="text-xs text-gray-500">Auto-Generated • {currentDate}</p>
                        {saveStatus && (
                            <p className={`text-xs font-medium ${saveStatus.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                                {saveStatus}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setReport(null)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            const blob = new Blob([report], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'Project_Thesis.md';
                            a.click();
                        }}
                        className="px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <span>⬇️ Download Markdown</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <span>🖨️ Print PDF</span>
                    </button>
                </div>
            </div>

            {/* Paper Content */}
            <div className="flex-1 overflow-auto bg-gray-100 p-8 print:p-0 print:bg-white">
                <div className="max-w-[210mm] mx-auto bg-white shadow-2xl min-h-[297mm] relative mb-8 print:shadow-none print:m-0 print:w-full flex flex-col">

                    {/* Visual Header */}
                    <div className="h-[25mm] border-b-2 border-gray-900 mx-[20mm] mt-[15mm] flex justify-between items-end pb-4">
                        <div className="text-right">
                            <div className="text-xs font-bold tracking-widest uppercase text-gray-400">Project Report</div>
                            <div className="text-sm font-serif font-bold text-gray-900">{userProfile?.stream || 'Engineering Department'}</div>
                        </div>
                        <div className="text-left">
                            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <span>🏛️</span>
                                <span>University Project</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="px-[25mm] py-[10mm] flex-1">
                        <article className="prose prose-lg max-w-none font-serif text-justify text-gray-900 report-content">
                            <div dangerouslySetInnerHTML={{
                                __html: window.marked ? window.marked.parse(sanitizeMarkdown(report)) : sanitizeMarkdown(report)
                            }} />
                        </article>
                    </div>

                    {/* Visual Footer */}
                    <div className="h-[20mm] border-t border-gray-200 mx-[20mm] mb-[10mm] flex justify-between items-center pt-4 text-xs text-gray-500 font-mono">
                        <div>Generated by Pideas AI • {currentDate}</div>
                        <div>Confidential Document</div>
                    </div>
                </div>

                <div className="text-center text-gray-400 text-sm pb-8 print:hidden">
                    — End of Document —
                </div>
            </div>
        </div>
    );
};
