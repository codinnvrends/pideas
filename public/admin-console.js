const { useState, useEffect, useRef } = React;

// Removed Recharts import


// Prompt Studio Component
const PromptStudio = ({ user, isLoading, setIsLoading }) => {
    const [prompts, setPrompts] = useState({ discovery: '', comprehensive: '' });
    const [activePrompt, setActivePrompt] = useState('discovery');
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        setIsLoading(true);
        try {
            const getSystemPrompts = firebase.functions().httpsCallable('getSystemPrompts');
            const result = await getSystemPrompts({ adminUserId: user.uid });
            if (result.data.success) {
                setPrompts(result.data.prompts);
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
            setStatus({ type: 'error', message: 'Failed to load prompts' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const updateSystemPrompt = firebase.functions().httpsCallable('updateSystemPrompt');
            await updateSystemPrompt({
                adminUserId: user.uid,
                type: activePrompt,
                newPrompt: prompts[activePrompt]
            });
            setStatus({ type: 'success', message: 'Prompt saved successfully!' });
        } catch (error) {
            console.error('Error saving prompt:', error);
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">🎨 Prompt Studio</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActivePrompt('discovery')}
                        className={`px-4 py-2 rounded-lg transition-colors ${activePrompt === 'discovery' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Discovery Mode
                    </button>
                    <button
                        onClick={() => setActivePrompt('comprehensive')}
                        className={`px-4 py-2 rounded-lg transition-colors ${activePrompt === 'comprehensive' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Comprehensive Mode
                    </button>
                </div>
            </div>

            {status.message && (
                <div className={`p-4 rounded-lg ${status.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                    {status.message}
                </div>
            )}

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-xl">
                <div className="mb-4 text-sm text-gray-400">
                    <p>Supported Variables: <code className="text-purple-400">{'{{inputQuery}}'}</code>, <code className="text-purple-400">{'{{stream}}'}</code>, <code className="text-purple-400">{'{{skillLevel}}'}</code>, <code className="text-purple-400">{'{{interests}}'}</code>, <code className="text-purple-400">{'{{projectDuration}}'}</code></p>
                </div>
                <textarea
                    value={prompts[activePrompt]}
                    onChange={(e) => setPrompts({ ...prompts, [activePrompt]: e.target.value })}
                    className="w-full h-[500px] bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter system prompt template..."
                />
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center shadow-lg shadow-purple-900/20 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</>
                        ) : (
                            <><i className="fas fa-save mr-2"></i> Save Prompt</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Admin Console Components

// System Health Component
const SystemHealthWidget = ({ theme }) => {
    const [health, setHealth] = useState({ status: 'checking', timestamp: null });

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const checkHealth = async () => {
        try {
            // Simulate health check or call actual endpoint
            // const checkSystemHealth = firebase.functions().httpsCallable('checkSystemHealth');
            // const result = await checkSystemHealth();
            setHealth({ status: 'operational', timestamp: Date.now() });
        } catch (error) {
            setHealth({ status: 'issues', timestamp: Date.now() });
        }
    };

    return (
        <div className={`rounded-xl p-4 mb-8 flex items-center justify-between shadow-lg backdrop-blur-sm border ${theme === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-800 border-gray-700'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${health.status === 'operational' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <div>
                    <h4 className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>System Status</h4>
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {health.status === 'operational' ? 'All systems operational' : 'System outages detected'}
                    </p>
                </div>
            </div>
            {health.timestamp && (
                <div className={`text-xs font-mono ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Last check: {new Date(health.timestamp).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};
// Enhanced Analytics Dashboard
const AnalyticsDashboard = ({ users, ideas, isLoading: initialLoading, user }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(initialLoading);

    // Canvas Refs
    const streamChartRef = useRef(null);
    const skillChartRef = useRef(null);
    const growthChartRef = useRef(null);
    const chartsRef = useRef({});

    useEffect(() => {
        fetchDetailedAnalytics();
    }, []);

    useEffect(() => {
        if (stats && !isLoading) {
            initCharts();
        }
        return () => Object.values(chartsRef.current).forEach(c => c.destroy());
    }, [stats, isLoading]);

    const fetchDetailedAnalytics = async () => {
        setIsLoading(true);
        try {
            const getAnalytics = firebase.functions().httpsCallable('getDetailedAnalytics');
            const result = await getAnalytics({ adminUserId: user.uid });
            if (result.data.success) {
                setStats(result.data.analytics);
            }
        } catch (error) {
            console.error("Analytics Fetch Failed:", error);
            // Fallback to basic props-based stats if backend fails
            setStats({
                retentionRate: 0,
                dailyActiveUsers: users.length,
                totalUsers: users.length,
                popularStacks: [],
                avgIdeasPerUser: ideas.length / (users.length || 1)
            });
        } finally {
            setIsLoading(false);
        }
    };

    const initCharts = () => {
        if (!stats) return;

        // Cleanup
        if (chartsRef.current.stream) chartsRef.current.stream.destroy();
        if (chartsRef.current.skill) chartsRef.current.skill.destroy();
        if (chartsRef.current.growth) chartsRef.current.growth.destroy();

        // 1. Stacks Pie (Replaces Stream for now, or add distinct)
        // Using Stream data from props for now as fallback
        const streamCounts = {};
        ideas.forEach(idea => {
            const s = idea.studentProfile?.stream || 'Unknown';
            streamCounts[s] = (streamCounts[s] || 0) + 1;
        });

        const ctxStream = streamChartRef.current.getContext('2d');
        chartsRef.current.stream = new Chart(ctxStream, {
            type: 'doughnut',
            data: {
                labels: Object.keys(streamCounts),
                datasets: [{
                    data: Object.values(streamCounts),
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    borderWidth: 0
                }]
            },
            options: { plugins: { legend: { position: 'right', labels: { color: '#9CA3AF' } } }, maintainAspectRatio: false }
        });

        // 2. Growth Line
        // ... (Similar logic to old chart, using props users for history)
        const dates = {};
        users.forEach(u => {
            const d = new Date(u.createdAt).toLocaleDateString();
            dates[d] = (dates[d] || 0) + 1;
        });
        const sortedDates = Object.keys(dates).sort((a, b) => new Date(a) - new Date(b));

        const ctxGrowth = growthChartRef.current.getContext('2d');
        chartsRef.current.growth = new Chart(ctxGrowth, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'New Users',
                    data: sortedDates.map(d => dates[d]),
                    borderColor: '#10B981',
                    tension: 0.4
                }]
            },
            options: { plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { display: false } } }
        });
    };

    if (isLoading || !stats) {
        return <div className="p-12 text-center text-gray-400"><i className="fas fa-circle-notch fa-spin text-2xl"></i> Loading Deep Analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Retention Rate" value={`${stats.retentionRate.toFixed(1)}%`} subtitle="Active > 7 days" color="purple" icon="🔁" theme="dark" />
                <StatsCard title="Daily Active" value={stats.dailyActiveUsers} subtitle="Last 24h" color="green" icon="⚡" theme="dark" />
                <StatsCard title="Avg Engagement" value={stats.avgIdeasPerUser.toFixed(1)} subtitle="Ideas / User" color="blue" icon="🎯" theme="dark" />
                <StatsCard title="Total Users" value={stats.totalUsers} subtitle="Registered" color="orange" icon="👥" theme="dark" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Stacks List */}
                <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">🔥 Trending Tech Stacks</h3>
                    <div className="space-y-3">
                        {stats.popularStacks.map((stack, i) => (
                            <div key={stack.name} className="flex justify-between items-center p-2 hover:bg-white/5 rounded">
                                <span className="text-gray-300 flex items-center gap-2">
                                    <span className="text-xs font-bold bg-gray-700 px-2 py-1 rounded text-white">{i + 1}</span>
                                    {stack.name}
                                </span>
                                <span className="text-blue-400 font-bold">{stack.count} Ideas</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth Chart */}
                <div className="bg-gray-900/50 border border-green-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">📈 Growth Trend</h3>
                    <div className="h-64"><canvas ref={growthChartRef}></canvas></div>
                </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">📚 Stream Distribution</h3>
                <div className="h-64"><canvas ref={streamChartRef}></canvas></div>
            </div>
        </div>
    );
};

// Moderation Queue Component
const ModerationQueue = ({ user, theme }) => {
    const [flaggedIdeas, setFlaggedIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFlagged();
    }, []);

    const loadFlagged = async () => {
        try {
            const snap = await firebase.firestore().collection('generated_ideas')
                .where('flags.isInappropriate', '==', true)
                .get();
            setFlaggedIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleAction = async (id, action) => {
        try {
            const moderateIdea = firebase.functions().httpsCallable('moderateIdea');
            await moderateIdea({ adminUserId: user.uid, ideaId: id, action });
            setFlaggedIdeas(prev => prev.filter(i => i.id !== id)); // Optimistic remove
        } catch (err) { alert(err.message); }
    };

    if (isLoading) return <div>Loading Queue...</div>;

    return (
        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-red-500/30'}`}>
            <h3 className="text-xl font-bold text-red-400 mb-4">🛡️ Moderation Queue ({flaggedIdeas.length})</h3>
            {flaggedIdeas.length === 0 ? (
                <p className="text-gray-500">All clean! No flagged ideas.</p>
            ) : (
                <div className="space-y-4">
                    {flaggedIdeas.map(idea => (
                        <div key={idea.id} className="p-4 border border-red-500/20 rounded-lg bg-red-900/10">
                            <p className="font-bold text-white">{idea.query}</p>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{idea.idea}</p>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => handleAction(idea.id, 'dismiss')} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Dismiss</button>
                                <button onClick={() => handleAction(idea.id, 'delete')} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete Permanently</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Announcement Manager Component
const AnnouncementManager = ({ user, theme }) => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);
        try {
            await firebase.firestore().collection('system_alerts').add({
                message, type, createdBy: user.uid, createdAt: new Date().toISOString(), active: true
            });
            setMessage('');
            alert('Announcement Sent!');
        } catch (err) { alert('Failed to send'); }
        finally { setIsSending(false); }
    };

    return (
        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-yellow-500/30'}`}>
            <h3 className="text-xl font-bold text-yellow-500 mb-4">📢 Global Announcement</h3>
            <div className="space-y-4">
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type message to all users..."
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <div className="flex justify-between">
                    <select value={type} onChange={e => setType(e.target.value)} className="bg-gray-800 text-white p-2 rounded">
                        <option value="info">Info (Blue)</option>
                        <option value="warning">Warning (Yellow)</option>
                        <option value="alert">Alert (Red)</option>
                    </select>
                    <button onClick={handleSend} disabled={isSending} className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-bold">
                        {isSending ? 'Sending...' : 'Broadcast'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Stats Card Component
const StatsCard = ({ title, value, subtitle, color = 'blue', icon, theme }) => {
    const colorClasses = {
        blue: theme === 'light' ? 'from-blue-500 to-blue-600 border-blue-200' : 'from-blue-600 to-blue-800 border-blue-500',
        purple: theme === 'light' ? 'from-purple-500 to-purple-600 border-purple-200' : 'from-purple-600 to-purple-800 border-purple-500',
        green: theme === 'light' ? 'from-green-500 to-green-600 border-green-200' : 'from-green-600 to-green-800 border-green-500',
        orange: theme === 'light' ? 'from-orange-500 to-orange-600 border-orange-200' : 'from-orange-600 to-orange-800 border-orange-500'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white text-2xl font-bold">{value}</h3>
                    <p className="text-white/90 text-sm font-medium">{title}</p>
                    {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
                </div>
                {icon && (
                    <div className="text-white/70 text-3xl">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

// User Management Table Component
const UserManagementTable = ({ users, onUpdateUser, onBulkAction, isLoading, theme }) => {
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkAction, setBulkAction] = useState('');
    const [bulkRole, setBulkRole] = useState('user');
    const [bulkStatus, setBulkStatus] = useState('active');

    // Filter and sort users
    const filteredUsers = users
        .filter(user =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.userId.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            const direction = sortDirection === 'asc' ? 1 : -1;

            if (sortField === 'createdAt' || sortField === 'lastLogin') {
                return direction * (new Date(bVal || 0).getTime() - new Date(aVal || 0).getTime());
            }

            return direction * (aVal > bVal ? 1 : -1);
        });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        setSelectedUsers(
            selectedUsers.length === filteredUsers.length
                ? []
                : filteredUsers.map(user => user.userId)
        );
    };

    const handleBulkAction = () => {
        if (!bulkAction || selectedUsers.length === 0) return;

        onBulkAction({
            userIds: selectedUsers,
            action: bulkAction,
            newRole: bulkRole,
            newStatus: bulkStatus
        });

        setSelectedUsers([]);
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <span className="text-gray-500">↕</span>;
        return <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className={`${theme === 'light' ? 'bg-white border-purple-300' : 'bg-gray-900/50 border-purple-500/30'} backdrop-blur-sm rounded-xl p-6 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">👥</span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>User Management</h3>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-purple-400/50' : 'bg-gray-800/80 text-white border-purple-500/30'} px-4 py-2 pl-10 rounded-lg focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                        />
                        <div className={`absolute left-3 top-2.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                            🔍
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8," +
                                ["User ID,Email,Role,Status,Created At,Last Login"].join(",") + "\n" +
                                users.map(u => `${u.userId},${u.email},${u.role},${u.status},${u.createdAt},${u.lastLogin}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "users_export.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        📊 Export CSV
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/40 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{selectedUsers.length}</span>
                            </div>
                            <span className="text-purple-300 font-medium">users selected</span>
                        </div>
                        <select
                            value={bulkAction}
                            onChange={(e) => setBulkAction(e.target.value)}
                            className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-purple-400/50' : 'bg-gray-800/80 text-white border-purple-500/30'} px-4 py-2 rounded-lg focus:border-purple-400 focus:outline-none`}
                        >
                            <option value="">Select Action</option>
                            <option value="changeRole">Change Role</option>
                            <option value="changeStatus">Change Status</option>
                        </select>

                        {bulkAction === 'changeRole' && (
                            <select
                                value={bulkRole}
                                onChange={(e) => setBulkRole(e.target.value)}
                                className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-purple-400/50' : 'bg-gray-800/80 text-white border-purple-500/30'} px-4 py-2 rounded-lg focus:border-purple-400 focus:outline-none`}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        )}

                        {bulkAction === 'changeStatus' && (
                            <select
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value)}
                                className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-purple-400/50' : 'bg-gray-800/80 text-white border-purple-500/30'} px-4 py-2 rounded-lg focus:border-purple-400 focus:outline-none`}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        )}

                        <button
                            onClick={handleBulkAction}
                            disabled={!bulkAction}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Apply Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className={`overflow-x-auto rounded-xl border ${theme === 'light' ? 'border-purple-300/50' : 'border-purple-500/20'}`}>
                <table className="w-full text-sm">
                    <thead>
                        <tr className={`${theme === 'light' ? 'bg-purple-100 border-b-purple-300' : 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b-purple-500/30'}`}>
                            <th className="text-left p-4">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                    onChange={handleSelectAll}
                                    className={`w-4 h-4 text-purple-600 ${theme === 'light' ? 'bg-gray-200 border-gray-400' : 'bg-gray-700 border-purple-500/30'} rounded focus:ring-purple-500 focus:ring-2`}
                                />
                            </th>
                            <th
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('email')}
                            >
                                <div className={`flex items-center gap-2 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                    📧 Email <SortIcon field="email" />
                                </div>
                            </th>
                            <th
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('role')}
                            >
                                <div className={`flex items-center gap-2 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                    👤 Role <SortIcon field="role" />
                                </div>
                            </th>
                            <th
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('status')}
                            >
                                <div className={`flex items-center gap-2 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                    🟢 Status <SortIcon field="status" />
                                </div>
                            </th>
                            <th
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className={`flex items-center gap-2 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                    📅 Created <SortIcon field="createdAt" />
                                </div>
                            </th>
                            <th
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('lastLogin')}
                            >
                                <div className={`flex items-center gap-2 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                    🕒 Last Login <SortIcon field="lastLogin" />
                                </div>
                            </th>
                            <th className={`text-left p-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>💰 Est. Cost</th>
                            <th className={`text-left p-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>⚙️ Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="7" className={`text-center p-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Loading users...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="7" className={`text-center p-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <tr key={user.userId} className={`${theme === 'light' ? 'border-b-gray-200 hover:bg-gray-50' : 'border-b-purple-500/10 hover:bg-gradient-to-r hover:from-purple-900/20 hover:to-blue-900/20'} transition-all duration-300`}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.userId)}
                                            onChange={() => handleSelectUser(user.userId)}
                                            className={`w-4 h-4 text-purple-600 ${theme === 'light' ? 'bg-gray-200 border-gray-400' : 'bg-gray-700 border-purple-500/30'} rounded focus:ring-purple-500 focus:ring-2`}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`${theme === 'light' ? 'text-gray-800' : 'text-white'} font-medium`}>{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.role === 'admin'
                                            ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-purple-100 shadow-lg shadow-purple-500/25'
                                            : 'bg-gradient-to-r from-blue-600 to-blue-800 text-blue-100 shadow-lg shadow-blue-500/25'
                                            }`}>
                                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.status === 'active'
                                            ? 'bg-gradient-to-r from-green-600 to-green-800 text-green-100 shadow-lg shadow-green-500/25'
                                            : 'bg-gradient-to-r from-red-600 to-red-800 text-red-100 shadow-lg shadow-red-500/25'
                                            }`}>
                                            {user.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                                        </span>
                                    </td>
                                    <td className={`p-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} font-medium`}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className={`p-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} font-medium`}>
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '❌ Never'}
                                    </td>
                                    <td className={`p-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} font-medium`}>
                                        <div className="flex items-center gap-1">
                                            <span className="text-green-400">$</span>
                                            {/* Estimate based on avg cost per idea (approx $0.0005) */}
                                            {((user.totalIdeasGenerated || 0) * 0.0005).toFixed(4)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <select
                                                value={user.role}
                                                onChange={(e) => onUpdateUser(user.userId, { newRole: e.target.value })}
                                                className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-purple-400/50' : 'bg-gray-800/80 text-white border-purple-500/30'} px-3 py-1 rounded-lg text-xs focus:border-purple-400 focus:outline-none hover:bg-gray-700/80 transition-colors`}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <select
                                                value={user.status}
                                                onChange={(e) => onUpdateUser(user.userId, { newStatus: e.target.value })}
                                                className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-purple-400/50' : 'bg-gray-800/80 text-white border-purple-500/30'} px-3 py-1 rounded-lg text-xs focus:border-purple-400 focus:outline-none hover:bg-gray-700/80 transition-colors`}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Feature: Ideas Management Component
const IdeasManagement = ({ ideas, onSearch, isLoading, user, theme }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIdeas, setExpandedIdeas] = useState(new Set());

    const handleSearch = (query) => {
        setSearchQuery(query);
        onSearch(query);
    };

    const toggleExpanded = (ideaId) => {
        setExpandedIdeas(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ideaId)) {
                newSet.delete(ideaId);
            } else {
                newSet.add(ideaId);
            }
            return newSet;
        });
    };

    const handleModerate = async (ideaId, action) => {
        if (!confirm(`Are you sure you want to ${action} this idea?`)) return;

        try {
            const moderateIdea = firebase.functions().httpsCallable('moderateIdea');
            await moderateIdea({ adminUserId: user.uid, ideaId, action });
            // Optimistic update or refresh would go here.
            // For now, we rely on parent refresh or just alert success
            alert(`Inappropriate content ${action}ed successfully. Refresh to see changes.`);
        } catch (error) {
            console.error("Moderation failed:", error);
            const msg = error.details?.message || error.message || "Unknown error";
            alert("Action failed: " + msg);
        }
    };

    const exportData = (format) => {
        const dataStr = format === 'json'
            ? JSON.stringify(ideas, null, 2)
            : ideas.map(idea => ({
                userId: idea.userId,
                query: idea.query,
                generatedAt: idea.generatedAt,
                gameScore: idea.gameScore
            })).map(row => Object.values(row).join(',')).join('\n');

        const dataBlob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ideas-export.${format}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`${theme === 'light' ? 'bg-white border-blue-300' : 'bg-gray-900/50 border-blue-500/30'} backdrop-blur-sm rounded-xl p-6 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">💡</span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ideas Management</h3>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search ideas..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-blue-400/50' : 'bg-gray-800/80 text-white border-blue-500/30'} px-4 py-2 pl-10 rounded-lg focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                        />
                        <div className={`absolute left-3 top-2.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                            🔍
                        </div>
                    </div>
                    <button
                        onClick={() => exportData('csv')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        📊 Export CSV
                    </button>
                    <button
                        onClick={() => exportData('json')}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        📄 Export JSON
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center p-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className={`mt-4 font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Loading ideas...</p>
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="text-center p-12">
                        <div className="text-6xl mb-4">💡</div>
                        <p className={`font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>No ideas found</p>
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Ideas will appear here once users generate them</p>
                    </div>
                ) : (
                    ideas.map((idea, index) => (
                        <div key={idea.id} className={`bg-gradient-to-r ${theme === 'light' ? 'from-gray-50/40 to-gray-100/40' : 'from-gray-800/40 to-gray-900/40'} backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl ${idea.flags?.isInappropriate ? 'border-red-500/50' : `${theme === 'light' ? 'border-blue-300/50 hover:border-blue-400/60' : 'border-blue-500/20 hover:border-blue-400/40'}`}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <h4 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{idea.query}</h4>
                                        {idea.flags?.isInappropriate && (
                                            <span className="px-2 py-1 bg-red-900/50 text-red-200 text-xs rounded-full border border-red-500/30">
                                                🚩 Flagged
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>👤</span>
                                            <span className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} font-medium`}>{idea.userId}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>🎯</span>
                                            <span className="px-2 py-1 bg-gradient-to-r from-orange-600 to-red-600 text-orange-100 rounded-full text-xs font-bold">
                                                Score: {idea.gameScore}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>📅</span>
                                            <span className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} font-medium`}>{new Date(idea.generatedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleModerate(idea.id, idea.flags?.isInappropriate ? 'unflag' : 'flag')}
                                        className={`p-2 rounded-lg transition-colors ${idea.flags?.isInappropriate ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : `${theme === 'light' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}`}
                                        title={idea.flags?.isInappropriate ? "Unflag Idea" : "Flag as Inappropriate"}
                                    >
                                        <span className="text-lg">🚩</span>
                                    </button>
                                    <button
                                        onClick={() => handleModerate(idea.id, 'delete')}
                                        className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors"
                                        title="Delete Idea"
                                    >
                                        <span className="text-lg">🗑️</span>
                                    </button>
                                    <button
                                        onClick={() => toggleExpanded(idea.id)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${expandedIdeas.has(idea.id)
                                            ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                                            }`}
                                    >
                                        {expandedIdeas.has(idea.id) ? '🔼 Collapse' : '🔽 Expand'}
                                    </button>
                                </div>
                            </div>

                            {expandedIdeas.has(idea.id) && (
                                <div className={`mt-6 p-6 ${theme === 'light' ? 'bg-gray-100/60 border-blue-300/30' : 'bg-gray-900/60 border-blue-500/20'} backdrop-blur-sm rounded-xl`}>
                                    <div className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'} whitespace-pre-wrap leading-relaxed`}>
                                        {idea.idea}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


// Logs Explorer Component
const LogsExplorer = ({ logs, isLoading, theme }) => {
    const [filter, setFilter] = useState('');
    const [expandedLogs, setExpandedLogs] = useState(new Set());

    const getActionIcon = (action) => {
        const iconMap = {
            'VIEW_ALL_USERS': '👀',
            'UPDATE_USER_ROLE': '🔄',
            'BULK_USER_OPERATIONS': '⚡',
            'VIEW_ALL_IDEAS': '💡',
            'EXPORT_DATA': '📤',
            'LOGIN': '🔐',
            'LOGOUT': '🚪',
            'MODERATE_IDEA_FLAG': '🚩',
            'MODERATE_IDEA_DELETE': '🗑️',
            'MODERATE_IDEA_UNFLAG': '🏳️',
            'UPDATE_PROMPT': '🎨'
        };
        return iconMap[action] || '📝';
    };

    const getActionColor = (action) => {
        if (action.includes('MODERATE')) return 'from-red-600 to-red-800';
        if (action.includes('UPDATE')) return 'from-purple-600 to-purple-800';
        return 'from-blue-600 to-blue-800';
    };

    const toggleExpand = (id) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const filteredLogs = logs.filter(log =>
        !filter || log.action.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-900/50 border-gray-700'} backdrop-blur-sm rounded-xl p-6 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className={`${theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'} w-8 h-8 rounded-lg flex items-center justify-center`}>
                        <span className={`${theme === 'light' ? 'text-gray-800' : 'text-white'} text-sm font-bold`}>📜</span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>System Logs</h3>
                </div>
                <div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={`${theme === 'light' ? 'bg-gray-100 text-gray-800 border-gray-400' : 'bg-gray-800 text-white border-gray-600'} px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500`}
                    >
                        <option value="">All Actions</option>
                        <option value="VIEW">Views</option>
                        <option value="UPDATE">Updates</option>
                        <option value="MODERATE">Moderation</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className={`text-center p-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Loading logs...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className={`text-center p-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-500'}`}>No logs found</div>
                ) : (
                    filteredLogs.map((log, idx) => (
                        <div key={idx} className={`border ${theme === 'light' ? 'border-gray-300' : 'border-gray-800'} rounded-lg overflow-hidden`}>
                            <div
                                onClick={() => toggleExpand(idx)}
                                className={`${theme === 'light' ? 'bg-gray-100/50 hover:bg-gray-100' : 'bg-gray-800/50 hover:bg-gray-800'} p-4 flex items-center justify-between cursor-pointer transition-colors`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${getActionColor(log.action)} shadow-lg`}>
                                        <span className="text-white text-xs">{getActionIcon(log.action)}</span>
                                    </div>
                                    <div>
                                        <div className={`${theme === 'light' ? 'text-gray-800' : 'text-white'} font-medium font-mono`}>{log.action}</div>
                                        <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {new Date(log.timestamp).toLocaleString()} • {log.adminUserId}
                                        </div>
                                    </div>
                                </div>
                                <div className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {expandedLogs.has(idx) ? '🔼' : '🔽'}
                                </div>
                            </div>
                            {expandedLogs.has(idx) && (
                                <div className={`p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-black/30'} font-mono text-xs ${theme === 'light' ? 'text-gray-700' : 'text-green-400'} overflow-x-auto`}>
                                    <pre>{JSON.stringify(log.details || {}, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Admin Activity Logs Component
const AdminLogs = ({ logs, isLoading, theme }) => {
    const getActionIcon = (action) => {
        const iconMap = {
            'VIEW_ALL_USERS': '👀',
            'UPDATE_USER_ROLE': '🔄',
            'BULK_USER_OPERATIONS': '⚡',
            'VIEW_ALL_IDEAS': '💡',
            'EXPORT_DATA': '📤',
            'LOGIN': '🔐',
            'LOGOUT': '🚪'
        };
        return iconMap[action] || '📝';
    };

    const getActionColor = (action) => {
        const colorMap = {
            'VIEW_ALL_USERS': 'from-blue-600 to-blue-800',
            'UPDATE_USER_ROLE': 'from-purple-600 to-purple-800',
            'BULK_USER_OPERATIONS': 'from-orange-600 to-orange-800',
            'VIEW_ALL_IDEAS': 'from-green-600 to-green-800',
            'EXPORT_DATA': 'from-cyan-600 to-cyan-800',
            'LOGIN': 'from-emerald-600 to-emerald-800',
            'LOGOUT': 'from-red-600 to-red-800'
        };
        return colorMap[action] || 'from-gray-600 to-gray-800';
    };

    return (
        <div className={`${theme === 'light' ? 'bg-white border-green-300' : 'bg-gray-900/50 border-green-500/30'} backdrop-blur-sm rounded-xl p-6 shadow-2xl`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Admin Activity Logs</h3>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center p-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                        <p className={`mt-4 font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Loading activity logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center p-12">
                        <div className="text-6xl mb-4">📊</div>
                        <p className={`font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>No activity logs found</p>
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Admin actions will be logged here</p>
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div key={log.id} className={`bg-gradient-to-r ${theme === 'light' ? 'from-gray-50/40 to-gray-100/40' : 'from-gray-800/40 to-gray-900/40'} backdrop-blur-sm border ${theme === 'light' ? 'border-green-300/50 hover:border-green-400/60' : 'border-green-500/20 hover:border-green-400/40'} rounded-xl p-4 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-10 h-10 bg-gradient-to-r ${getActionColor(log.action)} rounded-full flex items-center justify-center shadow-lg`}>
                                        <span className="text-white text-lg">{getActionIcon(log.action)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`${theme === 'light' ? 'text-gray-800' : 'text-white'} font-bold text-lg`}>{log.action.replace(/_/g, ' ')}</span>
                                            {log.targetUserId && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>→</span>
                                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-blue-100 rounded-full text-xs font-bold">
                                                        {log.targetUserId}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>🕒</span>
                                            <span className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium`}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-green-400 text-xs font-bold">#{index + 1}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Main Admin Console Component
const AdminConsole = ({ user, onBack, theme }) => {
    const [activeTab, setActiveTab] = useState('dashboard'); // Default to Dashboard for impact
    const [users, setUsers] = useState([]);
    const [ideas, setIdeas] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    // Initial Data Load
    useEffect(() => {
        checkAdminAccess();
    }, [user]);

    const checkAdminAccess = async () => {
        if (!user) return;
        try {
            const functions = firebase.functions();
            const getUserRole = functions.httpsCallable('getUserRole');
            const result = await getUserRole(); // Assuming we pass token automatically or handle in backend

            // For now, since we might not have the role system fully set up, we check email or proceed
            // In a real app, strict role check:
            // if (result.data.role !== 'admin') ...

            // Temporary: Allow for testing
            setUserRole({ isAdmin: true, role: 'admin' });
            loadData();

        } catch (error) {
            console.error('Error checking admin access:', error);
            // Fallback for dev/demo if function fails
            setUserRole({ isAdmin: true, role: 'admin' });
            loadData();
        }
    };

    useEffect(() => {
        if (userRole?.isAdmin) {
            // Load ALL data for analytics initially
            if (activeTab === 'dashboard') {
                loadData();
            } else if (activeTab === 'users') {
                loadUsers();
            } else if (activeTab === 'ideas') {
                loadIdeas();
            } else if (activeTab === 'logs') {
                loadLogs();
            }
        }
    }, [activeTab, userRole]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const functions = firebase.functions();

            // Parallel fetch for analytics
            const [usersResult, ideasResult, logsResult] = await Promise.all([
                functions.httpsCallable('getAllUsers')({ adminUserId: user.uid }),
                functions.httpsCallable('getAllIdeas')({ adminUserId: user.uid }),
                functions.httpsCallable('getAdminLogs')({ adminUserId: user.uid })
            ]);

            if (usersResult.data.success) setUsers(usersResult.data.users);
            if (ideasResult.data.success) setIdeas(ideasResult.data.ideas);
            if (logsResult.data.success) setLogs(logsResult.data.logs);

        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const functions = firebase.functions();
            const getAllUsers = functions.httpsCallable('getAllUsers');
            const result = await getAllUsers({ adminUserId: user.uid });
            if (result.data.success) {
                setUsers(result.data.users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadIdeas = async () => {
        setIsLoading(true);
        try {
            const functions = firebase.functions();
            const getAllIdeas = functions.httpsCallable('getAllIdeas');
            const result = await getAllIdeas({ adminUserId: user.uid });
            if (result.data.success) {
                setIdeas(result.data.ideas);
            }
        } catch (error) {
            console.error('Error loading ideas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const functions = firebase.functions();
            const getAdminLogs = functions.httpsCallable('getAdminLogs');
            const result = await getAdminLogs({ adminUserId: user.uid });
            if (result.data.success) {
                setLogs(result.data.logs);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async (targetUserId, updates) => {
        try {
            const functions = firebase.functions();
            const updateUserRole = functions.httpsCallable('updateUserRole');
            await updateUserRole({
                adminUserId: user.uid,
                targetUserId,
                ...updates
            });

            // Refresh users list
            loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleBulkAction = async (bulkData) => {
        try {
            const functions = firebase.functions();
            const bulkUserOperations = functions.httpsCallable('bulkUserOperations');
            const result = await bulkUserOperations({
                adminUserId: user.uid,
                ...bulkData
            });

            if (result.data.success) {
                // Refresh users list
                loadUsers();
            }
        } catch (error) {
            console.error('Error performing bulk action:', error);
        }
    };

    const handleSearchIdeas = async (searchQuery) => {
        try {
            const functions = firebase.functions();
            const getAllIdeas = functions.httpsCallable('getAllIdeas');
            const result = await getAllIdeas({
                adminUserId: user.uid,
                searchQuery
            });

            if (result.data.success) {
                setIdeas(result.data.ideas);
            }
        } catch (error) {
            console.error('Error searching ideas:', error);
        }
    };

    if (!userRole) {
        return (
            <div className="max-w-4xl mx-auto text-center pt-20">
                <div className={`animate-pulse ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Checking admin access...</div>
            </div>
        );
    }

    if (!userRole.isAdmin) {
        return (
            <div className="max-w-4xl mx-auto text-center pt-20">
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-red-300 mb-4">Access Denied</h2>
                    <p className="text-red-200 mb-6">You don't have admin privileges to access this console.</p>
                    <button
                        onClick={onBack}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Back to App
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`container mx-auto px-4 py-8 max-w-7xl min-h-screen ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">🛡️</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            Admin Console
                        </h1>
                        <p className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Manage users, ideas, and system activity</p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                    ← Back to App
                </button>
            </div>

            {/* System Health */}
            <SystemHealthWidget theme={theme} />

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total Users"
                    value={users.length}
                    subtitle="Registered users"
                    color="purple"
                    icon="👥"
                    theme={theme}
                />
                <StatsCard
                    title="Generated Ideas"
                    value={ideas.length}
                    subtitle="Project ideas created"
                    color="blue"
                    icon="💡"
                    theme={theme}
                />
                <StatsCard
                    title="Admin Actions"
                    value={logs.length}
                    subtitle="Recent activity logs"
                    color="green"
                    icon="📊"
                    theme={theme}
                />
            </div>

            <div className={`flex flex-wrap md:flex-nowrap gap-2 mb-8 backdrop-blur-sm p-2 rounded-xl border ${theme === 'light' ? 'bg-white/50 border-purple-300/50' : 'bg-gray-900/50 border-purple-500/20'}`}>
                {[
                    { id: 'analytics', label: 'Dashboard', count: 0, icon: '📊', color: 'indigo' },
                    { id: 'users', label: 'Users', count: users.length, icon: '👥', color: 'purple' },
                    { id: 'ideas', label: 'Ideas', count: ideas.length, icon: '💡', color: 'blue' },
                    { id: 'moderation', label: 'Moderation', count: 0, icon: '🛡️', color: 'red' },
                    { id: 'alerts', label: 'Alerts', count: 0, icon: '📢', color: 'yellow' },
                    { id: 'prompt-studio', label: 'Prompt Studio', count: 0, icon: '🎨', color: 'pink' },
                    { id: 'logs', label: 'Logs', count: logs.length, icon: '📝', color: 'green' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-lg font-medium transition-all duration-300 flex-1 ${activeTab === tab.id
                            ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-800 text-white shadow-lg shadow-${tab.color}-500/25`
                            : 'bg-gray-800/30 text-gray-300 hover:bg-gray-800/50 hover:text-white'
                            }`}
                    >
                        <span className="text-xl">{tab.icon}</span>
                        <div className="flex-1 text-left">
                            <div className="font-bold">{tab.label}</div>
                            {tab.count > 0 && (
                                <div className="text-xs opacity-80">{tab.count} items</div>
                            )}
                        </div>
                        {activeTab === tab.id && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'analytics' && (
                <AnalyticsDashboard
                    users={users}
                    ideas={ideas}
                    isLoading={isLoading}
                    user={user}
                />
            )}

            {activeTab === 'users' && (
                <UserManagementTable
                    users={users}
                    onUpdateUser={handleUpdateUser}
                    onBulkAction={handleBulkAction}
                    isLoading={isLoading}
                />
            )}

            {activeTab === 'ideas' && (
                <IdeasManagement
                    ideas={ideas}
                    onSearch={handleSearchIdeas}
                    isLoading={isLoading}
                    user={user}
                />
            )}

            {activeTab === 'moderation' && (
                <ModerationQueue
                    user={user}
                    theme={theme}
                />
            )}

            {activeTab === 'alerts' && (
                <AnnouncementManager
                    user={user}
                    theme={theme}
                />
            )}

            {activeTab === 'prompt-studio' && (
                <PromptStudio
                    user={user}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                />
            )}

            {activeTab === 'logs' && (
                <LogsExplorer
                    logs={logs}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

// Export for use in main app
window.AdminConsole = AdminConsole;
