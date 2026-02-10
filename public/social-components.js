// Social & Gamification Components for Pideas

// Badge Definitions
const BADGES = {
    'first_step': { icon: '🌱', title: 'First Step', description: 'Generated your first project idea' },
    'architect': { icon: '🏗️', title: 'Architect', description: 'Generated 5+ project ideas' },
    'polyglot': { icon: '🗣️', title: 'Polyglot', description: 'Used 3+ different tech stacks' },
    'high_scorer': { icon: '🎯', title: 'High Scorer', description: 'Scored 800+ in Discovery Game' },
    'night_owl': { icon: '🦉', title: 'Night Owl', description: 'Generated an idea between 12 AM and 4 AM' },
    'social_butterfly': { icon: '🦋', title: 'Social Butterfly', description: 'Shared a project idea' },
    'visionary': { icon: '🔮', title: 'Visionary', description: 'Reached Level 5' },
    'early_bird': { icon: '🌅', title: 'Early Bird', description: 'Generated an idea between 5 AM and 9 AM' },
    'prompt_master': { icon: '✍️', title: 'Prompt Master', description: 'Provided a detailed description (>100 chars)' }
};

const BadgeCase = ({ userProfile, theme }) => {
    const userBadges = userProfile?.badges || [];
    // Use global GlassCard if available, else fallback div
    const Card = window.GlassCard || (({ children, className }) => <div className={`border rounded-xl ${className}`}>{children}</div>);

    return (
        <Card className={`p-6 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-opacity-30'}`} hoverEffect={true}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <span>🏆</span> Achievements
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {Object.entries(BADGES).map(([id, badge]) => {
                    const isUnlocked = userBadges.includes(id);
                    return (
                        <div key={id} className="relative group items-center flex flex-col gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border transition-all duration-300 ${isUnlocked
                                ? 'bg-yellow-500/20 border-yellow-500/50 grayscale-0 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                                : 'bg-gray-800 border-gray-700 grayscale opacity-40'
                                }`}>
                                {badge.icon}
                            </div>
                            <span className={`text-xs text-center font-medium ${isUnlocked ? (theme === 'light' ? 'text-gray-700' : 'text-gray-300') : 'text-gray-600'}`}>
                                {badge.title}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 backdrop-blur-md border border-white/10">
                                {badge.description}
                                {!isUnlocked && <span className="block text-gray-500 italic mt-0.5">Locked</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const LeaderboardWidget = ({ theme }) => {
    const [leaders, setLeaders] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const Card = window.GlassCard || (({ children, className }) => <div className={`border rounded-xl ${className}`}>{children}</div>);
    const Loader = window.SkeletonLoader || (({ className }) => <div className={`animate-pulse bg-gray-700 ${className}`}></div>);

    React.useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const snapshot = await firebase.firestore()
                    .collection('users')
                    .orderBy('xp', 'desc')
                    .limit(5)
                    .get();

                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setLeaders(data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaders();
    }, []);

    if (isLoading) return <Loader className="h-48 rounded-xl w-full" />;

    return (
        <Card className={`p-6 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-opacity-30'}`} hoverEffect={true}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <span>👑</span> Top Innovators
            </h3>
            <div className="space-y-3">
                {leaders.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-110 ${index === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/40' :
                            index === 1 ? 'bg-gray-400 text-black shadow-lg shadow-gray-400/40' :
                                index === 2 ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40' :
                                    'bg-gray-700 text-gray-400'
                            }`}>
                            {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${theme === 'light' ? 'text-gray-900' : 'text-gray-200'}`}>
                                {user.displayName || 'Anonymous User'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="text-yellow-500">✨</span> {user.xp || 0} XP
                                <span className="mx-1">•</span>
                                <span>Lvl {Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const SocialShareModal = ({ idea, onClose, theme, onShare }) => {
    const [copied, setCopied] = React.useState(false);
    const shareUrl = `${window.location.origin}?shareId=${idea.id}`; // Assuming idea.id corresponds to a generated_ideas doc ID

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        if (onShare) onShare();
        setTimeout(() => setCopied(false), 2000);
    };

    const shareText = `Check out this project idea I generated with Pideas: ${idea.title}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all scale-100 ${theme === 'light' ? 'bg-white' : 'bg-[#1e1e1e] border border-gray-700'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Share Project Idea</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl mb-6 text-white">
                    <div className="text-xs font-medium opacity-80 uppercase tracking-widest mb-1">Project Idea</div>
                    <div className="text-lg font-bold leading-tight">{idea.title}</div>
                    <div className="mt-2 text-xs opacity-90 truncate">{idea.description}</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Public Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm border ${theme === 'light'
                                    ? 'bg-gray-50 border-gray-200 text-gray-700'
                                    : 'bg-black/30 border-gray-700 text-gray-300'
                                    }`}
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onShare && onShare()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-xl font-medium transition-colors"
                        >
                            <span>Twitter</span>
                        </a>
                        <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onShare && onShare()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-medium transition-colors"
                        >
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export components for use in app.js (available globally via script tag)
window.BadgeCase = BadgeCase;
window.LeaderboardWidget = LeaderboardWidget;
window.SocialShareModal = SocialShareModal;

// Daily Quest Widget
const DailyQuestWidget = ({ user, onUpdate, theme }) => {
    const quests = user?.dailyQuests || [];
    const [updating, setUpdating] = React.useState(null);
    const Card = window.GlassCard || (({ children, className }) => <div className={`border rounded-xl ${className}`}>{children}</div>);

    const handleQuestClick = async (questId) => {
        if (updating) return;
        setUpdating(questId);
        try {
            const updateQuest = firebase.functions().httpsCallable('updateQuestProgress');
            const res = await updateQuest({ userId: user.uid, questId });
            if (res.data.success) {
                if (onUpdate) onUpdate(); // Refresh user data
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <Card className={`p-6 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-opacity-30'}`} hoverEffect={true}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <span>⚔️</span> Daily Quests
            </h3>
            <div className="space-y-3">
                {quests.length === 0 ? (
                    <p className="text-gray-500 text-sm">No quests available today.</p>
                ) : (
                    quests.map(quest => (
                        <div
                            key={quest.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${quest.completed
                                ? 'bg-green-900/20 border-green-500/30 opacity-70'
                                : `${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/5 hover:bg-white/10'}`
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${quest.completed ? 'bg-green-500 border-green-500' : 'border-gray-400'
                                }`}>
                                {quest.completed && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${quest.completed ? 'text-gray-400 line-through' : (theme === 'light' ? 'text-gray-800' : 'text-gray-200')}`}>
                                    {quest.text}
                                </p>
                                <p className="text-xs text-yellow-500 font-bold">+{quest.xp} XP</p>
                            </div>
                            {updating === quest.id && <div className="animate-spin text-blue-500">⏳</div>}
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};

// Streak Counter Component
const StreakCounter = ({ streak, theme }) => {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg shadow-orange-500/10 ${theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/20 border-orange-500/30'
            }`}>
            <span className="text-lg animate-pulse">🔥</span>
            <span className={`font-bold ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`}>
                {streak || 0}
            </span>
        </div>
    );
};

// Skill Tree Component
const SkillTree = ({ user, userProfile, theme }) => {
    // 1. Calculate Global Level
    const globalLevel = Math.floor(Math.sqrt((userProfile?.xp || 0) / 100)) + 1;

    // 2. Define Skills
    const skillDefinitions = [
        {
            id: 'web',
            label: 'Web',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            ),
            keywords: ['web', 'react', 'js', 'html', 'css']
        },
        {
            id: 'backend',
            label: 'API',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
            ),
            keywords: ['backend', 'api', 'sql', 'db']
        },
        {
            id: 'ai',
            label: 'AI',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                    <path d="M12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"></path>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="12" y1="12" x2="20" y2="12"></line>
                    <line x1="12" y1="12" x2="4" y2="12"></line>
                    <circle cx="20" cy="12" r="2"></circle>
                    <circle cx="4" cy="12" r="2"></circle>
                </svg>
            ),
            keywords: ['ai', 'ml', 'gpt', 'bot']
        },
        {
            id: 'mobile',
            label: 'App',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
            ),
            keywords: ['mobile', 'app', 'ios', 'android']
        },
    ];

    // 3. Determine Unlock State
    const userContext = ((userProfile?.bio || '') + ' ' + (userProfile?.interests || '')).toLowerCase();
    const skills = skillDefinitions.map(def => ({
        ...def,
        unlocked: globalLevel >= 5 || def.keywords.some(k => userContext.includes(k)),
        level: globalLevel // Simplified line level
    }));

    return (
        <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <span className="text-green-400">⚡</span> Skill Network
                </h3>
                <span className="text-xs text-zinc-500 font-mono">Lvl {globalLevel}</span>
            </div>

            <div className="relative flex justify-between items-center px-2">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-700 -z-0"></div>
                <div
                    className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 -z-0 transition-all duration-1000 shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                    style={{ width: `${(skills.filter(s => s.unlocked).length / skills.length) * 100}%` }}
                ></div>

                {skills.map((skill, index) => (
                    <div key={skill.id} className="relative z-10 group">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${skill.unlocked
                                ? 'bg-zinc-900 border-green-500 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)] scale-110'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                                }`}
                        >
                            {skill.icon}
                        </div>

                        {/* Label */}
                        <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide transition-colors ${skill.unlocked ? 'text-white' : 'text-zinc-600'
                            }`}>
                            {skill.label}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-zinc-800 text-white text-[10px] rounded whitespace-nowrap pointer-events-none transition-opacity z-20">
                            {skill.unlocked ? `${skill.label} Unlocked` : `Add "${skill.keywords[0]}" to bio`}
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-4"></div> {/* Spacer for labels */}
        </div>
    );
};

window.DailyQuestWidget = DailyQuestWidget;
window.StreakCounter = StreakCounter;
window.SkillTree = SkillTree;
