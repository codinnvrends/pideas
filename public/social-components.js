// Social & Gamification Components for Pideas

// Badge Definitions
const BADGES = {
    'first_step': { icon: '🌱', title: 'First Step', description: 'Generated your first project idea' },
    'architect': { icon: '🏗️', title: 'Architect', description: 'Generated 5+ project ideas' },
    'polyglot': { icon: '🗣️', title: 'Polyglot', description: 'Used 3+ different tech stacks' },
    'high_scorer': { icon: '🎯', title: 'High Scorer', description: 'Scored 800+ in Discovery Game' },
    'night_owl': { icon: '🦉', title: 'Night Owl', description: 'Generated an idea between 12 AM and 4 AM' },
    'social_butterfly': { icon: '🦋', title: 'Social Butterfly', description: 'Shared a project idea' }
};

const BadgeCase = ({ userProfile, theme }) => {
    const userBadges = userProfile?.badges || [];

    return (
        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800/40 border-gray-700/50'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <span>🏆</span> Achievements
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {Object.entries(BADGES).map(([id, badge]) => {
                    const isUnlocked = userBadges.includes(id);
                    return (
                        <div key={id} className="relative group items-center flex flex-col gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border ${isUnlocked
                                ? 'bg-yellow-500/20 border-yellow-500/50 grayscale-0'
                                : 'bg-gray-800 border-gray-700 grayscale opacity-40'
                                }`}>
                                {badge.icon}
                            </div>
                            <span className={`text-xs text-center font-medium ${isUnlocked ? (theme === 'light' ? 'text-gray-700' : 'text-gray-300') : 'text-gray-600'}`}>
                                {badge.title}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {badge.description}
                                {!isUnlocked && <span className="block text-gray-500 italic mt-0.5">Locked</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LeaderboardWidget = ({ theme }) => {
    const [leaders, setLeaders] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

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

    if (isLoading) return <div className="animate-pulse h-48 bg-gray-800/40 rounded-xl"></div>;

    return (
        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800/40 border-gray-700/50'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <span>👑</span> Top Innovators
            </h3>
            <div className="space-y-3">
                {leaders.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                                index === 2 ? 'bg-orange-600 text-white' :
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
        </div>
    );
};

const SocialShareModal = ({ idea, onClose, theme }) => {
    const [copied, setCopied] = React.useState(false);
    const shareUrl = `${window.location.origin}?shareId=${idea.id}`; // Assuming idea.id corresponds to a generated_ideas doc ID

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
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
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-xl font-medium transition-colors"
                        >
                            <span>Twitter</span>
                        </a>
                        <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
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
        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800/40 border-gray-700/50'}`}>
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
                            onClick={() => !quest.completed && handleQuestClick(quest.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${quest.completed
                                    ? 'bg-green-900/20 border-green-500/30 opacity-70'
                                    : `${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100 border-gray-200' : 'bg-gray-700/30 hover:bg-gray-700/50 border-gray-600'}`
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
        </div>
    );
};

// Streak Counter Component
const StreakCounter = ({ streak, theme }) => {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/20 border-orange-500/30'
            }`}>
            <span className="text-lg">🔥</span>
            <span className={`font-bold ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`}>
                {streak || 0}
            </span>
        </div>
    );
};

// Skill Tree Component
const SkillTree = ({ user, theme }) => {
    // Simple mock skill tree for now
    const skills = [
        { id: 'web', label: 'Web Dev', icon: '🌐', level: 1, unlocked: true },
        { id: 'backend', label: 'Backend', icon: '⚙️', level: 1, unlocked: true },
        { id: 'ai', label: 'AI/ML', icon: '🤖', level: 0, unlocked: false },
        { id: 'cloud', label: 'Cloud', icon: '☁️', level: 0, unlocked: false },
    ];

    return (
        <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800/40 border-gray-700/50'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <span>🌳</span> Skill Tree
            </h3>
            <div className="flex justify-around relative">
                {/* Connecting Lines (Mock) */}
                <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-700 -z-10"></div>

                {skills.map(skill => (
                    <div key={skill.id} className="flex flex-col items-center gap-2 bg-gray-900 p-2 rounded-lg z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${skill.unlocked
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50'
                                : 'bg-gray-800 border-gray-600 text-gray-500 grayscale'
                            }`}>
                            {skill.icon}
                        </div>
                        <span className={`text-xs font-bold ${skill.unlocked ? 'text-blue-300' : 'text-gray-600'}`}>
                            {skill.label}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">Generate diverse ideas to unlock branches!</p>
        </div>
    );
};

window.DailyQuestWidget = DailyQuestWidget;
window.StreakCounter = StreakCounter;
window.SkillTree = SkillTree;
