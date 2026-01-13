const { useState, useEffect } = React;

// 1. Dynamic Typing Hero Component
const TypingHero = () => {
    const phrases = [
        "React E-commerce App",
        "Python AI Chatbot",
        "Mobile Fitness Tracker",
        "Blockchain Voting System",
        "IoT Smart Home Hub"
    ];
    const [text, setText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [speed, setSpeed] = useState(150);

    useEffect(() => {
        const handleType = () => {
            const currentPhrase = phrases[phraseIndex];
            const isFullPhrase = text === currentPhrase;
            const isEmpty = text === '';

            if (isDeleting) {
                setText(currentPhrase.substring(0, text.length - 1));
                setSpeed(50);
            } else {
                setText(currentPhrase.substring(0, text.length + 1));
                setSpeed(150);
            }

            if (!isDeleting && isFullPhrase) {
                setTimeout(() => setIsDeleting(true), 2000); // Pause at end
            } else if (isDeleting && isEmpty) {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % phrases.length);
            }
        };

        const timer = setTimeout(handleType, speed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, phraseIndex, speed]);

    return (
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 h-20 md:h-24">
            Build a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{text}</span>
            <span className="animate-pulse text-purple-500">|</span>
        </h2>
    );
};

// 2. Social Proof Stats Ticker
const SocialProofTicker = () => {
    const stats = [
        { icon: "🚀", label: "Ideas Generated", value: "1,200+" },
        { icon: "👩‍💻", label: "Active Builders", value: "500+" },
        { icon: "⭐", label: "User Rating", value: "4.8/5" }
    ];

    return (
        <div className="flex flex-wrap justify-center gap-6 mt-8 mb-12 animate-fade-in delay-100">
            {stats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="text-xl">{stat.icon}</span>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm leading-none">{stat.value}</span>
                        <span className="text-gray-400 text-xs leading-none mt-1">{stat.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// 3. Featured Projects Carousel
const FeaturedProjects = ({ onViewIdea }) => {
    const projects = [
        {
            title: "Eco-Friendly Marketplace",
            description: "A platform connecting local sustainable businesses with eco-conscious consumers using geolocation.",
            tags: ["React", "Node.js", "Maps API"],
            color: "green"
        },
        {
            title: "AI Study Companion",
            description: "Personalized learning assistant that generates quizzes from PDF lecture notes using NLP.",
            tags: ["Python", "OpenAI", "Streamlit"],
            color: "blue"
        },
        {
            title: "DeFi Portfolio Tracker",
            description: "Real-time dashboard tracking crypto assets across multiple chains with gas fee alerts.",
            tags: ["Web3.js", "Next.js", "Solidity"],
            color: "purple"
        }
    ];

    return (
        <div className="mt-16 w-full max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>✨</span> Featured Ideas
                </h3>
                <span className="text-sm text-gray-400">Curated by the community</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((project, idx) => (
                    <div
                        key={idx}
                        onClick={() => onViewIdea && onViewIdea(project)} // Placeholder action
                        className="group relative bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${project.color}-500 to-${project.color}-400`}></div>

                        <h4 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-white transition-colors">
                            {project.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                            {project.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-auto">
                            {project.tags.map(tag => (
                                <span key={tag} className="text-xs px-2 py-1 rounded-md bg-gray-700/50 text-gray-300 border border-gray-600/30">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. Quick Resume Button
const QuickResume = ({ onResume }) => {
    const [lastIdea, setLastIdea] = useState(null);

    useEffect(() => {
        // Mock data fetching from local storage for demo purposes
        // In real app, this would check localStorage or user profile
        const saved = localStorage.getItem('pideas_last_session');
        if (saved) {
            try {
                setLastIdea(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse last session", e);
            }
        }
    }, []);

    if (!lastIdea) return null;

    return (
        <div className="fixed bottom-8 right-8 z-50 animate-bounce-in">
            <button
                onClick={() => onResume(lastIdea)}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-full shadow-lg shadow-blue-900/40 transition-all duration-300 transform hover:scale-105"
            >
                <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Continue Building</span>
                    <span className="font-bold text-sm truncate max-w-[150px]">{lastIdea.title || "Untitled Project"}</span>
                </div>
                <span className="text-xl">→</span>
            </button>
        </div>
    );
};

// Export components to window for global access (since we aren't using modules)
window.LandingComponents = {
    TypingHero,
    SocialProofTicker,
    FeaturedProjects,
    QuickResume
};
