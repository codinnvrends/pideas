const { useState, useEffect, useRef, useCallback } = React;
const { createPortal } = ReactDOM;

// Add CSS animations and tooltip styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }
    
    /* Tooltip styles */
    .tooltip {
        position: relative;
        display: inline-block;
    }
    
    .tooltip .tooltip-text {
        visibility: hidden;
        width: max-content;
        max-width: 200px;
        background-color: #1f2937;
        color: #f9fafb;
        text-align: center;
        border-radius: 6px;
        padding: 8px 12px;
        position: absolute;
        z-index: 10000;
        bottom: 125%;
        left: 50%;
        margin-left: -60px;
        opacity: 0;
        transition: opacity 0.3s, visibility 0.3s;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid #374151;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        white-space: nowrap;
    }
    
    .tooltip .tooltip-text::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #1f2937 transparent transparent transparent;
    }
    
    .tooltip:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
    }
    
    .animate-fade-out {
        animation: fadeOut 0.3s ease-out forwards;
    }
    
    .profile-dropdown-enter {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }
    
    .profile-dropdown-enter-active {
        opacity: 1;
        transform: translateY(0) scale(1);
        transition: opacity 200ms, transform 200ms;
    }
    
    .profile-dropdown-exit {
        opacity: 1;
    }
    
    .profile-dropdown-exit-active {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
        transition: opacity 200ms, transform 200ms;
    }
    /* Light Mode Overrides */
    body.light-mode {
        background-color: #f8fafc !important; /* Slate 50 */
        color: #0f172a !important; /* Slate 900 */
    }
    
    /* Backgrounds */
    body.light-mode .bg-black { background-color: #f1f5f9 !important; } /* Slate 100 as main refreshing bg */
    body.light-mode .bg-gray-900 { background-color: #ffffff !important; border-color: #cbd5e1 !important; } /* White cards */
    body.light-mode .bg-gray-800\/30, 
    body.light-mode .bg-gray-800\/50,
    body.light-mode .bg-gray-900\/50,
    body.light-mode .bg-gray-900\/90 { 
        background-color: rgba(255, 255, 255, 0.8) !important; 
        backdrop-filter: blur(12px) !important;
        border-color: #e2e8f0 !important; /* Slate 200 */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
    }

    body.light-mode .bg-gray-800 { 
        background-color: #ffffff !important; 
        border-color: #e2e8f0 !important; 
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important; 
        color: #334155 !important;
    }
    
    body.light-mode .bg-zinc-900 { 
        background-color: #f1f5f9 !important; 
        border-color: #e2e8f0 !important;
        color: #334155 !important;
    }
    
    /* Text Colors */
    body.light-mode .text-white { color: #0f172a !important; } /* Slate 900 */
    body.light-mode .text-gray-100 { color: #1e293b !important; } /* Slate 800 */
    body.light-mode .text-gray-200 { color: #334155 !important; } /* Slate 700 */
    body.light-mode .text-gray-300 { color: #475569 !important; } /* Slate 600 */
    body.light-mode .text-gray-400 { color: #64748b !important; } /* Slate 500 */
    body.light-mode .text-gray-500 { color: #94a3b8 !important; } /* Slate 400 */
    
    /* Borders */
    body.light-mode .border-gray-700, 
    body.light-mode .border-gray-800,
    body.light-mode .border-zinc-700 { border-color: #e2e8f0 !important; } /* Slate 200 */

    /* Buttons & Interactive */
    body.light-mode button.bg-gray-800:hover { background-color: #f8fafc !important; }
    
    /* Specific Gradient/Header Fixes */
    body.light-mode header {
        background-color: rgba(255, 255, 255, 0.9) !important;
        border-bottom-color: #e2e8f0 !important;
    }
    
    /* Inputs */
    body.light-mode textarea, 
    body.light-mode input[type="text"] {
        background-color: #ffffff !important;
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
    }
    
    /* Particles Canvas in Light mode needs to be behind but visible */
    body.light-mode canvas#particles-canvas {
        opacity: 0.6;
    }


    /* Toast Notifications */
    .toast-enter {
        transform: translateX(100%);
        opacity: 0;
    }
    .toast-enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: all 300ms ease-out;
    }
    .toast-exit {
        transform: translateX(0);
        opacity: 1;
    }
    .toast-exit-active {
        transform: translateX(100%);
        opacity: 0;
        transition: all 300ms ease-in;
    }
`;
document.head.appendChild(styleSheet);

// SVG Icon Components
const HistoryIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
    </svg>
);

const AdminIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const LogoutIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16,17 21,12 16,7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const IdeaIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
        <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
        <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
        <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
        <circle cx="12" cy="12" r="7" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
    </svg>
);

const EditIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const ResetIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23,4 23,10 17,10" />
        <polyline points="1,20 1,14 7,14" />
        <path d="M3 21v-8a2 2 0 0 1-2-2h17.25c.414 0 .75-.336.75-.75V3.25c0-.414-.336-.75-.75-.75H3.25c-.414 0-.75.336-.75.75v8.25c0 .414.336.75.75.75h11.25" />
    </svg>
);

// Toast Component
const Toast = ({ id, message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const icons = {
        success: <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
        error: <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
        info: <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        warning: <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    };

    const bgColors = {
        success: 'bg-green-900/40 border-green-800',
        error: 'bg-red-900/40 border-red-800',
        info: 'bg-blue-900/40 border-blue-800',
        warning: 'bg-yellow-900/40 border-yellow-800'
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg min-w-[300px] mb-2 toast-enter-active ${bgColors[type] || bgColors.info}`}>
            <div className="flex-shrink-0">
                {icons[type] || icons.info}
            </div>
            <p className="text-sm font-medium text-white flex-1">{message}</p>
            <button onClick={() => onClose(id)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;

    return ReactDOM.createPortal(
        <div className="fixed top-4 right-4 z-[99999] flex flex-col items-end">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </div>,
        document.body
    );
};

const CloseIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const GoogleIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const GitHubIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
    </svg>
);

// IconButton Component - Reusable button with icon and tooltip
const IconButton = ({
    iconType,
    tooltip,
    onClick,
    className = "",
    disabled = false,
    variant = "default" // "default", "primary", "admin"
}) => {
    const baseClasses = "relative inline-flex items-center justify-center p-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 tooltip";

    const variantClasses = {
        default: "text-gray-400 hover:text-white hover:bg-gray-800/50",
        primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
        admin: "bg-purple-600 hover:bg-purple-700 text-white"
    };

    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

    const getIcon = () => {
        switch (iconType) {
            case 'history': return <HistoryIcon size={20} />;
            case 'admin': return <AdminIcon size={20} />;
            case 'logout': return <LogoutIcon size={20} />;
            case 'idea': return <IdeaIcon size={20} />;
            case 'edit': return <EditIcon size={20} />;
            case 'reset': return <ResetIcon size={20} />;
            case 'close': return <CloseIcon size={20} />;
            default: return <div className="w-5 h-5" />;
        }
    };

    return (
        <button
            onClick={disabled ? undefined : onClick}
            className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
            disabled={disabled}
        >
            {getIcon()}
            <span className="tooltip-text">{tooltip}</span>
        </button>
    );
};

// Import the InteractiveLogo component
// InteractiveLogo.js must be loaded before this script

// Particle System Component with Theme Support
const ParticleSystem = ({ theme }) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize particles
        const initParticles = () => {
            particlesRef.current = [];
            const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 10000));

            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };

        initParticles();

        // Mouse move handler
        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Set colors based on theme
            const particleColor = theme === 'light' ? '0, 0, 0' : '255, 255, 255'; // Pure Black vs White
            const connectionColor = theme === 'light' ? '0, 0, 0' : '255, 255, 255'; // Black vs White

            // Draw particles
            particlesRef.current.forEach((particle, index) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Mouse interaction
                const dx = mouseRef.current.x - particle.x;
                const dy = mouseRef.current.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    particle.vx += dx * force * 0.001;
                    particle.vy += dy * force * 0.001;
                }

                // Boundary check
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                // Keep particles in bounds
                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
                ctx.fill();

                // Draw connections
                particlesRef.current.slice(index + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(${connectionColor}, ${0.1 * (1 - distance / 100)})`;
                        ctx.stroke();
                    }
                });
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [theme]); // Re-run effect when theme changes to ensure colors update

    return <canvas ref={canvasRef} id="particles-canvas" className="fixed inset-0 pointer-events-none" />;
};

// How It Works Modal Component
const HowItWorksModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-zinc-900/90 border border-zinc-700/50 rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <CloseIcon size={24} />
                </button>

                {/* Modal Header */}
                <div className="p-8 text-center border-b border-zinc-800/50">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        How Pideas Works
                    </h2>
                    <p className="text-gray-400">Turn your interests into a complete project roadmap in seconds</p>
                </div>

                {/* Steps Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-lg group-hover:bg-blue-500/20 transition-all opacity-0 group-hover:opacity-100" />
                            <div className="relative bg-black/40 border border-zinc-700/50 rounded-xl p-6 h-full flex flex-col items-center text-center hover:border-blue-500/50 transition-colors">
                                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 text-3xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    🚀
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">1. Choose Your Path</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Either start with a specific domain you love, or take our quick discovery quiz to find your perfect match.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-purple-500/10 rounded-xl blur-lg group-hover:bg-purple-500/20 transition-all opacity-0 group-hover:opacity-100" />
                            <div className="relative bg-black/40 border border-zinc-700/50 rounded-xl p-6 h-full flex flex-col items-center text-center hover:border-purple-500/50 transition-colors">
                                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 text-3xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                    🧠
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">2. AI Analysis</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Our advanced AI analyzes your skills, academic year, and interests to tailor a unique project idea just for you.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-green-500/10 rounded-xl blur-lg group-hover:bg-green-500/20 transition-all opacity-0 group-hover:opacity-100" />
                            <div className="relative bg-black/40 border border-zinc-700/50 rounded-xl p-6 h-full flex flex-col items-center text-center hover:border-green-500/50 transition-colors">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-3xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                    📦
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">3. Get Full Roadmap</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Receive a complete comprehensive guide: technical stack, implementation steps, and even a starter codebase!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-zinc-800/50 text-center bg-black/20">
                    <button
                        onClick={onClose}
                        className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
                    >
                        Got it, let's build!
                    </button>
                </div>
            </div>
        </div>
    );
};

// Trending Ticker Component
const TrendingTicker = () => {
    const trendingIdeas = [
        "🤖 AI-Powered Study Assistant",
        "🌱 IoT Smart Garden System",
        "🏥 Telemedicine Blockchain Platform",
        "🚗 Autonomous Traffic Control",
        "📱 AR Interior Design App",
        "🔐 Zero-Knowledge Auth System",
        "🌍 Carbon Footprint Tracker",
        "🎵 AI Music Composer",
        "🎮 VR Education Platform",
        "📊 Predictive Stock Market Analyzer"
    ];

    return (
        <div className="w-full bg-black/40 backdrop-blur-md border-y border-white/5 py-3 overflow-hidden relative z-20">
            <div className="flex items-center gap-8 whitespace-nowrap animate-[scroll_30s_linear_infinite] hover:pause-animation">
                {/* Duplicate list to create seamless loop */}
                {[...trendingIdeas, ...trendingIdeas].map((idea, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-400 font-medium text-sm">
                        <span className="text-blue-500">⚡</span>
                        {idea}
                    </div>
                ))}
            </div>
            {/* Gradient masks for smooth fade edges */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </div>
    );
};

// Dual-Path Login Screen Component
const LoginScreen = ({ onLogin, onDiscoveryPath, isLoading, theme, toggleTheme }) => {
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    return (
        <div className="min-h-screen bg-black relative overflow-hidden font-sans">
            {/* Modal */}
            {showHowItWorks && createPortal(
                <HowItWorksModal onClose={() => setShowHowItWorks(false)} />,
                document.body
            )}

            {/* Fixed position background particles with overlay */}
            <div className="fixed inset-0 z-0">
                <ParticleSystem theme={theme} />
                <div className={`absolute inset-0 pointer-events-none ${theme === 'light' ? 'bg-gradient-to-br from-blue-50/50 via-white/80 to-purple-50/50' : 'bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10'}`} />
            </div>

            {/* Main content container */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="w-full h-32 flex items-center justify-center relative pt-8">
                    <div className="absolute top-8 right-8 z-50">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 transition-colors rounded-lg ${theme === 'light' ? 'text-gray-600 hover:bg-gray-100 hover:text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            {theme === 'light' ? (
                                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="w-full h-full relative z-10 transform hover:scale-105 transition-transform duration-500">
                        <InteractiveLogo theme={theme} />
                    </div>
                </header>

                {/* Hero Text */}
                <div className="text-center mb-12 relative z-10 px-4">
                    <h1 className={`text-5xl md:text-7xl font-bold bg-clip-text text-transparent tracking-tight mb-4 drop-shadow-2xl ${theme === 'light' ? 'bg-gradient-to-r from-black via-gray-800 to-gray-600' : 'bg-gradient-to-r from-white via-blue-100 to-gray-300'}`}>
                        Stop Brainstorming. <br className="hidden md:block" /> Start Building.
                    </h1>
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto font-light ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        AI-powered project ideas tailored to your skills, interests, and academic goals.
                    </p>
                </div>

                {/* Content area with enhanced cards */}
                <main className="flex-1 flex items-start justify-center px-4 pb-20">
                    <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-8">

                        {/* Existing Users Card */}
                        <div className="group relative">
                            <div className={`absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500 ${theme === 'light' ? 'bg-gradient-to-r from-blue-300 to-cyan-300' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}></div>
                            <div className={`relative h-full rounded-2xl p-8 transition-all duration-300 flex flex-col ${theme === 'light' ? 'bg-white border-gray-200 border shadow-xl' : 'bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20'}`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${theme === 'light' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30'}`}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-3 tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    I Know What I Want
                                </h3>
                                <p className={`text-sm mb-8 leading-relaxed flex-grow font-light ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Skip the discovery phase. Directly input your domain (e.g., "AI Health App") and generate a comprehensive project plan instantly.
                                </p>
                                <button
                                    onClick={onLogin}
                                    disabled={isLoading}
                                    className={`w-full px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-3 transform group-hover:translate-y-[-2px] shadow-lg ${theme === 'light' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100 shadow-white/5'}`}
                                >
                                    <GoogleIcon size={20} />
                                    {isLoading ? 'Connecting...' : 'Continue with Google'}
                                </button>
                            </div>
                        </div>

                        {/* Discovery Path Card */}
                        <div className="group relative">
                            <div className={`absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500 ${theme === 'light' ? 'bg-gradient-to-r from-purple-300 to-pink-300' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}></div>
                            <div className={`relative h-full rounded-2xl p-8 transition-all duration-300 flex flex-col ${theme === 'light' ? 'bg-white border-gray-200 border shadow-xl' : 'bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20'}`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${theme === 'light' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'}`}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-3 tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Help Me Discover
                                </h3>
                                <p className={`text-sm mb-8 leading-relaxed flex-grow font-light ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Not sure where to start? Take our 30-second interactive quiz to uncover project ideas that match your unique skills and interests.
                                </p>
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem('startDiscoveryAfterLogin', 'true');
                                        onLogin();
                                    }}
                                    disabled={isLoading}
                                    className={`w-full px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-3 backdrop-blur-md transform group-hover:translate-y-[-2px] ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                                >
                                    <span className="text-xl">✨</span>
                                    {isLoading ? 'Starting...' : 'Start Discovery'}
                                </button>
                            </div>
                        </div>

                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowHowItWorks(true)}
                            className="group flex items-center justify-center gap-2 mx-auto text-gray-500 hover:text-white transition-colors duration-300 px-4 py-2 rounded-full hover:bg-white/5"
                        >
                            <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-600 group-hover:border-white text-xs">?</span>
                            <span className="text-sm font-medium tracking-wide">How it works</span>
                        </button>
                    </div>

                    {/* Social Proof / Trusted By */}
                    {/* <div className="absolute bottom-6 left-0 w-full text-center">
                        <p className="text-gray-600 text-xs font-medium uppercase tracking-widest mb-4">Trusted by students from</p>
                        <div className="flex justify-center gap-8 opacity-40 grayscale">
                            <span className="text-gray-500 font-bold">MIT</span>
                            <span className="text-gray-500 font-bold">STANFORD</span>
                            <span className="text-gray-500 font-bold">IIT</span>
                        </div>
                    </div> */}
                </main>

                {/* Trending Ticker at Bottom */}
                <TrendingTicker />
            </div>
        </div>
    );
};

// Discovery Path Components

// Gamified Discovery Onboarding Component
const DiscoveryOnboarding = ({ onComplete, user }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [userProfile, setUserProfile] = useState({
        fieldOfStudy: '',
        skillLevel: '',
        interests: [],
        resources: {
            timeAvailable: '',
            budget: '',
            tools: []
        },
        learningGoals: []
    });
    const [progress, setProgress] = useState(0);
    const [badges, setBadges] = useState([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [stepKey, setStepKey] = useState(0); // Force re-render of DiscoveryStep

    const discoverySteps = [
        {
            id: 'stream',
            title: '🎓 What\'s your academic stream?',
            subtitle: 'Select your field of study',
            type: 'single-choice',
            options: [
                { value: 'computer-science', label: 'Computer Science/IT', icon: '💻' },
                { value: 'electronics', label: 'Electronics/ECE', icon: '🔌' },
                { value: 'mechanical', label: 'Mechanical Engineering', icon: '⚙️' },
                { value: 'civil', label: 'Civil Engineering', icon: '🏗️' },
                { value: 'chemical', label: 'Chemical Engineering', icon: '🧪' },
                { value: 'biotech', label: 'Biotechnology', icon: '🧬' },
                { value: 'sciences', label: 'Pure Sciences', icon: '🔬' },
                { value: 'mathematics', label: 'Mathematics', icon: '🔢' }
            ]
        },
        {
            id: 'year',
            title: '📚 What\'s your current academic year?',
            subtitle: 'This helps us match project complexity',
            type: 'single-choice',
            options: [
                { value: '1st-year', label: '1st Year (Freshman)', description: 'Building fundamentals', icon: '1️⃣' },
                { value: '2nd-year', label: '2nd Year (Sophomore)', description: 'Developing core skills', icon: '2️⃣' },
                { value: '3rd-year', label: '3rd Year (Junior)', description: 'Applying knowledge', icon: '3️⃣' },
                { value: '4th-year', label: '4th Year (Senior)', description: 'Advanced applications', icon: '4️⃣' },
                { value: 'graduate', label: 'Graduate/Masters', description: 'Specialized expertise', icon: '🎓' }
            ]
        },
        {
            id: 'interests',
            title: '🚀 What type of project excites you most?',
            subtitle: 'Select all that interest you (multiple choices)',
            type: 'multi-choice',
            options: [
                { value: 'web-mobile', label: 'Web/Mobile Applications', icon: '🌐' },
                { value: 'ai-ml', label: 'AI/Machine Learning', icon: '🤖' },
                { value: 'iot-hardware', label: 'IoT/Hardware Projects', icon: '🔧' },
                { value: 'data-analysis', label: 'Data Analysis/Visualization', icon: '📊' },
                { value: 'game-dev', label: 'Game Development', icon: '🎮' },
                { value: 'automation', label: 'Automation/Robotics', icon: '🦾' },
                { value: 'research', label: 'Research/Analysis', icon: '🔬' },
                { value: 'social-impact', label: 'Social Impact Projects', icon: '🌍' }
            ]
        },
        {
            id: 'skillLevel',
            title: '⭐ How would you rate your programming/technical skills?',
            subtitle: 'Be honest - this helps us match you with appropriate projects',
            type: 'single-choice',
            options: [
                { value: 'beginner', label: 'Beginner (Just starting)', description: 'Learning fundamentals', icon: '🌱' },
                { value: 'intermediate', label: 'Intermediate (Some projects done)', description: 'Comfortable with basics', icon: '🚀' },
                { value: 'advanced', label: 'Advanced (Multiple complex projects)', description: 'Can tackle challenging tasks', icon: '⚡' },
                { value: 'expert', label: 'Expert (Teaching/Mentoring others)', description: 'Deep technical knowledge', icon: '🧠' }
            ]
        },
        {
            id: 'teamSize',
            title: '👥 What\'s your preferred team size?',
            subtitle: 'How many people would you like to work with?',
            type: 'single-choice',
            options: [
                { value: 'solo', label: 'Solo Project (Individual)', icon: '🧑‍💻' },
                { value: 'pair', label: 'Pair Programming (2 people)', icon: '👥' },
                { value: 'small-team', label: 'Small Team (3-4 people)', icon: '👨‍👩‍👧' },
                { value: 'large-team', label: 'Large Team (5+ people)', icon: '👨‍👩‍👧‍👦' }
            ]
        },
        {
            id: 'projectDuration',
            title: '⏰ How much time can you dedicate to this project?',
            subtitle: 'This helps us suggest appropriately scoped projects',
            type: 'single-choice',
            options: [
                { value: 'quick', label: 'Quick Sprint (1-2 weeks)', icon: '⚡' },
                { value: 'short', label: 'Short Term (1 month)', icon: '📅' },
                { value: 'medium', label: 'Medium Term (2-3 months)', icon: '📆' },
                { value: 'long', label: 'Long Term (6+ months)', icon: '🗓️' }
            ]
        },
        {
            id: 'budgetRange',
            title: '💰 What\'s your budget range for this project?',
            subtitle: 'In Indian Rupees (INR)',
            type: 'single-choice',
            options: [
                { value: 'no-budget', label: 'No Budget (Free resources only)', description: '₹0', icon: '👍' },
                { value: 'low-budget', label: 'Low Budget', description: '₹1,000 - ₹5,000', icon: '💸' },
                { value: 'medium-budget', label: 'Medium Budget', description: '₹5,000 - ₹15,000', icon: '💵' },
                { value: 'high-budget', label: 'High Budget', description: '₹15,000+', icon: '💰' }
            ]
        },
        {
            id: 'learningGoals',
            title: '🎯 What do you want to achieve with this project?',
            subtitle: 'Select your primary objectives (multiple choices)',
            type: 'multi-choice',
            options: [
                { value: 'portfolio', label: 'Build Portfolio', icon: '💼' },
                { value: 'learn-tech', label: 'Learn New Technology', icon: '📚' },
                { value: 'solve-problem', label: 'Solve Real Problems', icon: '🔧' },
                { value: 'job-ready', label: 'Become Job-Ready', icon: '💻' },
                { value: 'startup-idea', label: 'Explore Startup Ideas', icon: '🚀' },
                { value: 'academic-project', label: 'Complete Academic Project', icon: '🎓' },
                { value: 'research-paper', label: 'Publish Research Paper', icon: '📓' },
                { value: 'competition', label: 'Win Competition/Hackathon', icon: '🏆' }
            ]
        },
        {
            id: 'preferredTechnologies',
            title: '💻 Which technologies are you most comfortable with?',
            subtitle: 'Select all that you have experience with (multiple choices)',
            type: 'multi-choice',
            options: [
                { value: 'python', label: 'Python/Django/Flask', icon: '🐍' },
                { value: 'javascript', label: 'JavaScript/React/Node.js', icon: 'ⓙⓢ' },
                { value: 'java', label: 'Java/Spring', icon: '☕' },
                { value: 'cpp', label: 'C++/C', icon: '©️' },
                { value: 'mobile', label: 'Mobile (Android/iOS)', icon: '📱' },
                { value: 'database', label: 'Database (SQL/NoSQL)', icon: '🗄️' },
                { value: 'cloud', label: 'Cloud (AWS/Azure/GCP)', icon: '☁️' },
                { value: 'no-preference', label: 'No specific preference', icon: '🔄' }
            ]
        },
        {
            id: 'engineeringDomain',
            title: '🛠️ Which engineering domain interests you most?',
            subtitle: 'For specialized engineering project recommendations',
            type: 'single-choice',
            options: [
                { value: 'software', label: 'Software Engineering', icon: '💻' },
                { value: 'embedded', label: 'Embedded Systems', icon: '🔌' },
                { value: 'mechanical-design', label: 'Mechanical Design', icon: '⚙️' },
                { value: 'electrical', label: 'Electrical Systems', icon: '⚡' },
                { value: 'robotics', label: 'Robotics & Control', icon: '🤖' },
                { value: 'civil-structural', label: 'Civil/Structural', icon: '🏗️' },
                { value: 'environmental', label: 'Environmental Engineering', icon: '🌱' },
                { value: 'interdisciplinary', label: 'Interdisciplinary', icon: '🔄' }
            ]
        },
        {
            id: 'projectComplexity',
            title: '🧩 What level of project complexity are you looking for?',
            subtitle: 'Be realistic about your time and skill constraints',
            type: 'single-choice',
            options: [
                { value: 'basic', label: 'Basic (Core concepts)', description: 'Fundamental implementation', icon: '🔤' },
                { value: 'intermediate', label: 'Intermediate (Multiple components)', description: 'Moderate complexity', icon: '🔄' },
                { value: 'advanced', label: 'Advanced (System integration)', description: 'Complex architecture', icon: '🔥' },
                { value: 'research', label: 'Research-level (Novel approaches)', description: 'Pushing boundaries', icon: '🔬' }
            ]
        },
        {
            id: 'priorExperience',
            title: '💼 What\'s your prior project experience?',
            subtitle: 'This helps us gauge your familiarity with project development',
            type: 'single-choice',
            options: [
                { value: 'none', label: 'No Prior Projects', description: 'First-time project developer', icon: '🌟' },
                { value: 'classroom', label: 'Classroom Projects Only', description: 'Academic assignments', icon: '🎓' },
                { value: 'personal', label: 'Personal Projects', description: 'Self-initiated work', icon: '💻' },
                { value: 'internship', label: 'Internship/Industry Experience', description: 'Professional exposure', icon: '🏢' }
            ]
        },
        {
            id: 'industryFocus',
            title: '🏭 Which industry sector interests you most?',
            subtitle: 'For domain-specific project recommendations',
            type: 'single-choice',
            options: [
                { value: 'healthcare', label: 'Healthcare & Medical', icon: '🏥' },
                { value: 'education', label: 'Education & E-Learning', icon: '🎓' },
                { value: 'finance', label: 'Finance & Fintech', icon: '💰' },
                { value: 'retail', label: 'Retail & E-Commerce', icon: '🛍️' },
                { value: 'manufacturing', label: 'Manufacturing & Industry', icon: '🏭' },
                { value: 'entertainment', label: 'Entertainment & Media', icon: '🎬' },
                { value: 'agriculture', label: 'Agriculture & Sustainability', icon: '🌾' },
                { value: 'government', label: 'Government & Public Sector', icon: '🏢' }
            ]
        }
    ];

    const handleStepComplete = (stepData) => {
        console.log('handleStepComplete called with:', stepData, 'currentStep:', currentStep);

        // Prevent multiple rapid calls
        if (isTransitioning) {
            console.log('Already transitioning, ignoring duplicate call');
            return;
        }

        setIsTransitioning(true);

        const newProfile = { ...userProfile };
        const step = discoverySteps[currentStep];

        if (step.type === 'single-choice') {
            // Map each single-choice field to the correct profile property
            switch (step.id) {
                case 'stream':
                    newProfile.stream = stepData.value;
                    break;
                case 'year':
                    newProfile.year = stepData.value;
                    break;
                case 'skillLevel':
                    newProfile.skillLevel = stepData.value;
                    break;
                case 'teamSize':
                    newProfile.teamSize = stepData.value;
                    break;
                case 'projectDuration':
                    newProfile.projectDuration = stepData.value;
                    break;
                case 'budgetRange':
                    newProfile.budgetRange = stepData.value;
                    break;
                case 'engineeringDomain':
                    newProfile.engineeringDomain = stepData.value;
                    break;
                case 'projectComplexity':
                    newProfile.projectComplexity = stepData.value;
                    break;
                case 'priorExperience':
                    newProfile.priorExperience = stepData.value;
                    break;
                case 'industryFocus':
                    newProfile.industryFocus = stepData.value;
                    break;
                default:
                    // For backward compatibility
                    newProfile[step.id === 'field' ? 'fieldOfStudy' : 'skillLevel'] = stepData.value;
            }
        } else if (step.type === 'multi-choice') {
            // Map each multi-choice field to the correct profile property
            switch (step.id) {
                case 'interests':
                    newProfile.interests = stepData.values;
                    break;
                case 'learningGoals':
                    newProfile.learningGoals = stepData.values;
                    break;
                case 'preferredTechnologies':
                    newProfile.preferredTechnologies = stepData.values;
                    break;
                default:
                    // For backward compatibility
                    newProfile[step.id === 'interests' ? 'interests' : 'learningGoals'] = stepData.values;
            }
        } else if (step.type === 'resource-form') {
            newProfile.resources = { ...newProfile.resources, ...stepData };
        }

        setUserProfile(newProfile);

        // Award badges
        const newBadges = [...badges];
        if (currentStep === 0) newBadges.push('🎓 Academic Explorer');
        if (currentStep === 1) newBadges.push('⭐ Self-Aware Learner');
        if (currentStep === 2) newBadges.push('❤️ Passion Finder');
        if (currentStep === 3) newBadges.push('⏰ Resource Planner');
        if (currentStep === 4) newBadges.push('🎯 Goal Setter');
        setBadges(newBadges);

        const newProgress = ((currentStep + 1) / discoverySteps.length) * 100;
        setProgress(newProgress);

        console.log('Step completed:', currentStep, 'Moving to next step');

        if (currentStep < discoverySteps.length - 1) {
            // Move to next step after a short delay
            setTimeout(() => {
                console.log('Advancing from step', currentStep, 'to step', currentStep + 1);
                setCurrentStep(prev => {
                    const nextStep = prev + 1;
                    console.log('State update: currentStep changed from', prev, 'to', nextStep);
                    return nextStep;
                });
                setStepKey(prev => prev + 1); // Force re-render of DiscoveryStep
                setIsTransitioning(false);
            }, 1500);
        } else {
            // Complete the discovery process
            setTimeout(() => {
                console.log('Discovery completed, calling onComplete');
                onComplete(newProfile);
                setIsTransitioning(false);
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Progress Header */}
            <div className="bg-gray-900/80 border-b border-gray-800/60 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold text-white">Project Discovery Journey</h1>
                        <div className="text-sm text-gray-400">
                            Step {currentStep + 1} of {discoverySteps.length}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                            className="bg-gray-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Badges */}
                    {badges.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {badges.map((badge, index) => (
                                <span key={index} className="text-xs bg-gray-800/60 text-gray-300 px-2 py-1 rounded-full">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <DiscoveryStep
                    key={`step-${currentStep}-${stepKey}`} // Force re-render when step changes
                    step={discoverySteps[currentStep]}
                    onComplete={handleStepComplete}
                    stepNumber={currentStep + 1}
                    totalSteps={discoverySteps.length}
                    isTransitioning={isTransitioning}
                />
            </div>
        </div>
    );
};

// Individual Discovery Step Component
const DiscoveryStep = ({ step, onComplete, stepNumber, totalSteps, isTransitioning }) => {
    const [selectedValue, setSelectedValue] = useState('');
    const [selectedValues, setSelectedValues] = useState([]);
    const [formData, setFormData] = useState({});
    const [showEncouragement, setShowEncouragement] = useState(false);
    const [hasCompleted, setHasCompleted] = useState(false);

    // Reset state when step changes
    useEffect(() => {
        setSelectedValue('');
        setSelectedValues([]);
        setFormData({});
        setShowEncouragement(false);
        setHasCompleted(false);
        console.log('DiscoveryStep mounted/updated for step:', stepNumber, 'step data:', step);
    }, [step.id, stepNumber]);

    const handleSingleChoice = (value) => {
        if (hasCompleted || isTransitioning) {
            console.log('Choice already made or transitioning, ignoring click');
            return;
        }

        console.log('Single choice selected:', value);
        setSelectedValue(value);
        setShowEncouragement(true);
        setHasCompleted(true);

        // Show encouragement message then complete
        setTimeout(() => {
            console.log('Completing step with value:', value);
            onComplete({ value });
        }, 1200);
    };

    const handleMultiChoice = (value) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        setSelectedValues(newValues);
    };

    const handleMultiChoiceSubmit = () => {
        if (hasCompleted || isTransitioning) {
            console.log('Already completed or transitioning, ignoring submit');
            return;
        }

        if (selectedValues.length > 0) {
            console.log('Multi choice submitted:', selectedValues);
            setShowEncouragement(true);
            setHasCompleted(true);

            setTimeout(() => {
                console.log('Completing step with values:', selectedValues);
                onComplete({ values: selectedValues });
            }, 1200);
        }
    };

    const handleFormSubmit = () => {
        if (hasCompleted || isTransitioning) {
            console.log('Already completed or transitioning, ignoring form submit');
            return;
        }

        if (Object.keys(formData).length === step.fields.length) {
            console.log('Form submitted:', formData);
            setShowEncouragement(true);
            setHasCompleted(true);

            setTimeout(() => {
                console.log('Completing step with form data:', formData);
                onComplete(formData);
            }, 1200);
        }
    };

    const encouragementMessages = [
        "Great choice! 🌟",
        "Excellent! 🎉",
        "Perfect! ✨",
        "Awesome! 🚀",
        "Fantastic! 💫"
    ];

    return (
        <div className="max-w-2xl mx-auto">
            {showEncouragement ? (
                <div className="text-center animate-pulse">
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]}
                    </h2>
                    <p className="text-gray-400">Moving to next step...</p>
                </div>
            ) : (
                <>
                    {/* Progress Header - Matching GameStep style */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-blue-400 font-medium">Step {stepNumber} of {totalSteps}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Question Card - Matching GameStep style */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-6">{step.title}</h3>
                        <p className="text-gray-300 mb-6">{step.subtitle}</p>

                        {/* Single Choice Options */}
                        {step.type === 'single-choice' && (
                            <div className="space-y-3">
                                {step.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSingleChoice(option.value)}
                                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${selectedValue === option.value
                                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                            : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                                            }`}
                                        disabled={showEncouragement}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <div>
                                                <div className="font-medium">{option.label}</div>
                                                {option.description && (
                                                    <div className="text-gray-400 text-sm">{option.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Multi Choice Options */}
                        {step.type === 'multi-choice' && (
                            <>
                                <div className="space-y-3">
                                    {step.options.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleMultiChoice(option.value)}
                                            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${selectedValues.includes(option.value)
                                                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                                : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                                                }`}
                                            disabled={showEncouragement}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{option.icon}</span>
                                                <div className="font-medium">{option.label}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleMultiChoiceSubmit}
                                    disabled={selectedValues.length === 0 || showEncouragement}
                                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
                                >
                                    {showEncouragement ? 'Moving to next step...' : `Continue (${selectedValues.length} selected)`}
                                </button>
                            </>
                        )}

                        {/* Resource Form */}
                        {step.type === 'resource-form' && (
                            <>
                                <div className="space-y-4 mb-6">
                                    {step.fields.map((field) => (
                                        <div key={field.name}>
                                            <label className="block text-white font-medium mb-2">{field.label}</label>
                                            <select
                                                value={formData[field.name] || ''}
                                                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={showEncouragement}
                                            >
                                                <option value="">Select {field.label.toLowerCase()}...</option>
                                                {field.options.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleFormSubmit}
                                    disabled={Object.keys(formData).length !== step.fields.length || showEncouragement}
                                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
                                >
                                    {showEncouragement ? 'Moving to next step...' : 'Continue'}
                                </button>
                            </>
                        )}

                        {/* Debug info */}
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            Debug: Selected="{selectedValue || selectedValues.join(', ')}", ShowEncouragement={showEncouragement.toString()}, HasCompleted={hasCompleted.toString()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Personalized Idea Selection Component
const PersonalizedIdeaSelection = ({ userProfile, onIdeaSelect, onBackToDiscovery, user }) => {
    const [ideas, setIdeas] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);
    const [selectedIdea, setSelectedIdea] = useState(null);

    useEffect(() => {
        generatePersonalizedIdeas();
    }, []);

    const generatePersonalizedIdeas = async (regenerate = false) => {
        setIsGenerating(true);
        console.log('Generating personalized ideas for profile:', userProfile, 'regenerate:', regenerate);

        try {
            // Create a detailed prompt based on user profile
            const prompt = createPersonalizedPrompt(userProfile, regenerate);
            console.log('Generated prompt:', prompt);

            // Use existing idea generation system
            const generateIdea = firebase.functions().httpsCallable('generateIdea');
            console.log('Calling Firebase function generateIdea...');

            // Pass discoveryMode flag to ensure backend uses discovery prompt
            const result = await generateIdea({
                prompt,
                discoveryMode: true
            });
            console.log('Firebase function result:', result);

            if (result.data && result.data.success) {
                console.log('Successfully generated ideas, parsing content...');
                // Parse the generated content into multiple ideas
                const parsedIdeas = parseMultipleIdeas(result.data.idea);
                console.log('Parsed ideas:', parsedIdeas);

                if (parsedIdeas && parsedIdeas.length > 0) {
                    setIdeas(parsedIdeas);
                } else {
                    console.warn('No ideas parsed from generated content, using fallback');
                    setIdeas(generatePersonalizedFallbackIdeas(userProfile, regenerate));
                }
            } else {
                console.error('Firebase function returned error:', result.data?.error);
                throw new Error(result.data?.error || 'Failed to generate ideas');
            }
        } catch (error) {
            console.error('Error generating personalized ideas:', error);
            console.log('Using fallback ideas for profile:', userProfile);
            // Generate personalized fallback ideas based on user profile
            setIdeas(generatePersonalizedFallbackIdeas(userProfile, regenerate));
        } finally {
            setIsGenerating(false);
        }
    };

    const createPersonalizedPrompt = (profile, regenerate = false) => {
        // Extract all profile data with fallbacks
        const stream = profile.stream || 'Computer Science';
        const year = profile.year || '2nd-year';
        const interests = Array.isArray(profile.interests) ? profile.interests : [];
        const skillLevel = profile.skillLevel || 'intermediate';
        const teamSize = profile.teamSize || 'small-team';
        const projectDuration = profile.projectDuration || 'medium';
        const budgetRange = profile.budgetRange || 'no-budget';
        const learningGoals = Array.isArray(profile.learningGoals) ? profile.learningGoals : [];
        const preferredTechnologies = Array.isArray(profile.preferredTechnologies) ? profile.preferredTechnologies : [];
        const engineeringDomain = profile.engineeringDomain || 'software';
        const projectComplexity = profile.projectComplexity || 'intermediate';
        const priorExperience = profile.priorExperience || 'classroom';
        const industryFocus = profile.industryFocus || 'education';

        // Add variety for regeneration
        const varietyPrompts = [
            'Generate 6-8 diverse and creative project ideas',
            'Create 6-8 innovative project concepts',
            'Develop 6-8 unique project suggestions',
            'Design 6-8 engaging project proposals',
            'Craft 6-8 personalized project recommendations',
            'Build 6-8 tailored project blueprints'
        ];

        const focusAreas = [
            'cutting-edge technologies',
            'practical real-world applications',
            'innovative solutions to common problems',
            'emerging trends and technologies',
            'interdisciplinary approaches',
            'industry-specific solutions',
            'social impact initiatives',
            'entrepreneurial ventures'
        ];

        const basePrompt = regenerate ?
            varietyPrompts[Math.floor(Math.random() * varietyPrompts.length)] :
            'Generate 6-8 diverse project ideas';

        const focusArea = regenerate ?
            focusAreas[Math.floor(Math.random() * focusAreas.length)] :
            'practical applications';

        return `${basePrompt} for a ${skillLevel} level student in ${stream}, focusing on ${focusArea}. 
        
        Comprehensive User Profile:
        - Academic Stream: ${stream}
        - Academic Year: ${year}
        - Technical Skill Level: ${skillLevel}
        - Prior Experience: ${priorExperience}
        - Project Interests: ${interests.length > 0 ? interests.join(', ') : 'General programming'}
        - Preferred Technologies: ${preferredTechnologies.length > 0 ? preferredTechnologies.join(', ') : 'Open to any technology'}
        - Engineering Domain: ${engineeringDomain}
        - Desired Complexity: ${projectComplexity}
        - Team Size Preference: ${teamSize}
        - Project Duration: ${projectDuration}
        - Budget Range (INR): ${budgetRange}
        - Learning Goals: ${learningGoals.length > 0 ? learningGoals.join(', ') : 'Skill development'}
        - Industry Focus: ${industryFocus}
        
        ${regenerate ? 'Please provide DIFFERENT and MORE CREATIVE project ideas than typical suggestions. Think outside the box while' : 'Please provide diverse project ideas that'} match the user's profile. For each project idea, provide:
        1. Project Title
        2. Brief Description (2-3 sentences)
        3. Difficulty Level (Beginner/Intermediate/Advanced)
        4. Estimated Time (in weeks)
        5. Key Technologies/Skills Required
        6. Learning Outcomes
        
        Format each idea as:
        ## Project Title
        **Description:** [description]
        **Difficulty:** [level]
        **Time:** [duration]
        **Technologies:** [tech stack]
        **You'll Learn:** [outcomes]
        
        Make sure projects are realistic for the user's skill level and time constraints. Focus on projects that align with their interests and learning goals.${regenerate ? ' Avoid common or typical project suggestions - be creative and innovative!' : ''}`;
    };

    const parseMultipleIdeas = (generatedContent) => {
        const sections = generatedContent.split('## ').filter(section => section.trim());
        return sections.map((section, index) => {
            const lines = section.split('\n').filter(line => line.trim());
            const title = lines[0]?.trim() || `Project Idea ${index + 1}`;

            const description = extractField(lines, 'Description:') || 'Exciting project opportunity';
            const difficulty = extractField(lines, 'Difficulty:') || 'Intermediate';
            const time = extractField(lines, 'Time:') || '4-6 weeks';
            const technologies = extractField(lines, 'Technologies:') || 'Various technologies';
            const learning = extractField(lines, 'You\'ll Learn:') || 'Valuable skills';

            return {
                id: `idea-${index}`,
                title,
                description,
                difficulty,
                time,
                technologies,
                learning,
                fullContent: section
            };
        });
    };

    const extractField = (lines, fieldName) => {
        const line = lines.find(l => l.includes(fieldName));
        return line ? line.replace(`**${fieldName}**`, '').replace(fieldName, '').trim() : null;
    };

    const generatePersonalizedFallbackIdeas = (profile, regenerate = false) => {
        console.log('Generating personalized fallback ideas for:', profile, 'regenerate:', regenerate);

        const fieldOfStudy = profile.fieldOfStudy || 'computer-science';
        const skillLevel = profile.skillLevel || 'intermediate';
        const interests = Array.isArray(profile.interests) ? profile.interests : [];
        const timeAvailable = profile.resources?.timeAvailable || '1month';

        let fallbackIdeas = [];

        // Generate ideas based on field of study
        if (fieldOfStudy === 'computer-science' || fieldOfStudy === 'web-development') {
            fallbackIdeas.push({
                id: 'cs-1',
                title: 'Personal Portfolio Website',
                description: `Create a responsive portfolio website to showcase your ${fieldOfStudy} projects and skills. Perfect for ${skillLevel} developers.`,
                difficulty: skillLevel === 'beginner' ? 'Beginner' : 'Intermediate',
                time: timeAvailable === '1-2weeks' ? '1-2 weeks' : '2-3 weeks',
                technologies: 'HTML, CSS, JavaScript, React',
                learning: 'Web development fundamentals, responsive design, modern frameworks'
            });
        }

        if (fieldOfStudy === 'data-science' || interests.includes('data-analysis')) {
            fallbackIdeas.push({
                id: 'ds-1',
                title: 'Data Analysis Dashboard',
                description: `Create an interactive dashboard to visualize and analyze datasets relevant to ${fieldOfStudy}. Tailored for ${skillLevel} level.`,
                difficulty: skillLevel === 'beginner' ? 'Beginner' : 'Advanced',
                time: timeAvailable === '1-2weeks' ? '2-3 weeks' : '3-4 weeks',
                technologies: 'Python, Pandas, Plotly, Streamlit',
                learning: 'Data analysis, visualization, statistical insights, dashboard creation'
            });
        }

        if (interests.includes('mobile-apps') || fieldOfStudy === 'mobile-development') {
            fallbackIdeas.push({
                id: 'mobile-1',
                title: 'Mobile Task Manager',
                description: `Build a cross-platform mobile app for task management. Designed for ${skillLevel} developers in ${fieldOfStudy}.`,
                difficulty: skillLevel === 'beginner' ? 'Intermediate' : 'Advanced',
                time: timeAvailable === 'semester' ? '6-8 weeks' : '4-6 weeks',
                technologies: 'React Native, Firebase, Mobile UI/UX',
                learning: 'Mobile development, cross-platform frameworks, backend integration'
            });
        }

        if (interests.includes('ai-projects') || fieldOfStudy === 'ai-ml') {
            fallbackIdeas.push({
                id: 'ai-1',
                title: 'AI-Powered Chatbot',
                description: `Develop an intelligent chatbot using machine learning. Perfect for ${skillLevel} students interested in AI.`,
                difficulty: skillLevel === 'beginner' ? 'Intermediate' : 'Advanced',
                time: timeAvailable === '1-2weeks' ? '3-4 weeks' : '4-6 weeks',
                technologies: 'Python, TensorFlow, Natural Language Processing',
                learning: 'Machine learning, NLP, AI model training, conversational AI'
            });
        }

        if (interests.includes('games') || interests.includes('web-apps')) {
            fallbackIdeas.push({
                id: 'game-1',
                title: 'Interactive Web Game',
                description: `Create an engaging web-based game with modern technologies. Suitable for ${skillLevel} developers.`,
                difficulty: skillLevel === 'beginner' ? 'Beginner' : 'Intermediate',
                time: timeAvailable === '1-2weeks' ? '2-3 weeks' : '3-4 weeks',
                technologies: 'JavaScript, Canvas API, Game Physics',
                learning: 'Game development, interactive programming, user engagement'
            });
        }

        // Add more generic ideas if we don't have enough
        if (fallbackIdeas.length < 3) {
            fallbackIdeas.push({
                id: 'generic-1',
                title: `${fieldOfStudy.charAt(0).toUpperCase() + fieldOfStudy.slice(1)} Project`,
                description: `A comprehensive project tailored to your ${fieldOfStudy} background and ${skillLevel} skill level.`,
                difficulty: skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1),
                time: timeAvailable === '1-2weeks' ? '2-3 weeks' : '4-6 weeks',
                technologies: 'Modern tech stack relevant to your field',
                learning: 'Advanced skills in your chosen field'
            });
        }

        return fallbackIdeas.slice(0, 6);
    };

    const handleIdeaSelect = (idea) => {
        console.log('Idea selected:', idea);
        setSelectedIdea(idea);
        // Pass the selected idea and user profile to the parent component
        onIdeaSelect(idea, userProfile);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty.toLowerCase()) {
            case 'beginner': return 'text-green-400';
            case 'intermediate': return 'text-yellow-400';
            case 'advanced': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getDifficultyIcon = (difficulty) => {
        switch (difficulty.toLowerCase()) {
            case 'beginner': return '🌱';
            case 'intermediate': return '🚀';
            case 'advanced': return '⚡';
            default: return '📋';
        }
    };

    if (isGenerating) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-700 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Crafting Your Perfect Projects</h2>
                    <p className="text-gray-400">Analyzing your profile to generate personalized ideas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-gray-900/80 border-b border-gray-800/60 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">Your Personalized Project Ideas</h1>
                            <p className="text-gray-400">Based on your profile: {userProfile.fieldOfStudy} • {userProfile.skillLevel} level</p>
                        </div>
                        <button
                            onClick={onBackToDiscovery}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700/50"
                        >
                            ← Back to Discovery
                        </button>
                    </div>
                </div>
            </div>

            {/* Ideas Grid */}
            <div className="max-w-6xl mx-auto p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ideas.map((idea) => (
                        <div key={idea.id} className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-6 hover:border-gray-700/80 hover:bg-gray-900/80 transition-all duration-300">
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-sm font-medium ${getDifficultyColor(idea.difficulty)} flex items-center gap-1`}>
                                        {getDifficultyIcon(idea.difficulty)} {idea.difficulty}
                                    </span>
                                    <span className="text-xs text-gray-500 bg-gray-800/60 px-2 py-1 rounded-full">
                                        ⏱️ {idea.time}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-3">{idea.title}</h3>
                                <p className="text-gray-300 text-sm mb-4 leading-relaxed">{idea.description}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div>
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Technologies</h4>
                                    <p className="text-sm text-gray-300">{idea.technologies}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">You'll Learn</h4>
                                    <p className="text-sm text-gray-300">{idea.learning}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleIdeaSelect(idea)}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors border border-gray-700/50 flex items-center justify-center gap-2"
                            >
                                <span>Choose This Project</span>
                                <span>→</span>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={() => generatePersonalizedIdeas(true)}
                        disabled={isGenerating}
                        className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors border border-gray-700/50 flex items-center gap-2 mx-auto"
                    >
                        <span>{isGenerating ? '⏳' : '🔄'}</span>
                        {isGenerating ? 'Generating...' : 'Generate More Ideas'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Discovery Result Component - Shows comprehensive project plan using ProjectIdeaDisplay
const DiscoveryResult = ({ idea, userProfile, onBackToSelection, onExitDiscovery, user }) => {
    if (!idea || !idea.comprehensivePlan) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">No Project Plan Available</h2>
                    <button
                        onClick={onBackToSelection}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Back to Ideas
                    </button>
                </div>
            </div>
        );
    }

    // Custom actions for Discovery mode to inject into the standard header
    const discoveryActions = (
        <>
            <button
                onClick={onBackToSelection}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-700/50 flex items-center gap-2"
            >
                <span>←</span>
                <span>Back</span>
            </button>
            <button
                onClick={onExitDiscovery}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
                Exit Discovery
            </button>
        </>
    );

    return (
        <div className="h-screen bg-black text-white relative overflow-hidden">
            {/* Particle Background */}
            <div className="absolute inset-0 z-0">
                <div className="stars"></div>
                <div className="twinkling"></div>
            </div>

            {/* Use unified ProjectIdeaDisplay with custom navigation actions */}
            {/* We pass hideHeader={false} (default) so standard header renders. */}
            {/* We pass customHeaderActions to replace standard nav buttons. */}
            <div className="relative z-10 h-screen">
                <ProjectIdeaDisplay
                    idea={idea.comprehensivePlan}
                    onStartNew={onBackToSelection}
                    user={user}
                    hideHeader={false}
                    customHeaderActions={discoveryActions}
                />
            </div>
        </div>
    );
};

// Game Step Component
const GameStep = ({ step, onAnswer, currentScore, totalSteps }) => {
    const [selectedOption, setSelectedOption] = useState('');
    const [showResult, setShowResult] = useState(false);

    // Reset state when step changes
    useEffect(() => {
        setSelectedOption('');
        setShowResult(false);
    }, [step.stepId]);

    const handleSubmit = () => {
        if (!selectedOption) {
            console.log('No option selected, cannot submit');
            return;
        }

        console.log('Submitting answer:', selectedOption);
        setShowResult(true);
        setTimeout(() => {
            onAnswer({
                stepId: step.stepId,
                question: step.question,
                answer: selectedOption,
                category: step.category,
                points: step.points
            });
        }, 1500);
    };

    const handleOptionClick = (option) => {
        console.log('Option clicked:', option);
        setSelectedOption(option);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-blue-400 font-medium">Step {step.stepId} of {totalSteps}</span>
                    <span className="text-green-400 font-medium">Score: {currentScore}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(step.stepId / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-6">{step.question}</h3>

                <div className="space-y-3">
                    {step.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${selectedOption === option
                                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                                }`}
                            disabled={showResult}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {showResult && (
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500 rounded-lg px-4 py-2">
                            <span className="text-green-400">✓</span>
                            <span className="text-green-300">+{step.points} points earned!</span>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!selectedOption || showResult}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
                >
                    {showResult ? 'Moving to next step...' : 'Continue'}
                </button>

                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                    Debug: Selected="{selectedOption}", ShowResult={showResult.toString()}, ButtonEnabled={(!selectedOption || showResult) ? 'false' : 'true'}
                </div>
            </div>
        </div>
    );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, content, isExpanded, onToggle, icon, isSpecial = false }) => {
    return (
        <div className={`${isSpecial
            ? 'bg-gray-900/80 border-blue-500/20'
            : 'bg-gray-900/60 border-gray-700/30'
            } backdrop-blur-sm border rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 mb-3 hover:border-gray-600/50`}>
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-all duration-200 rounded-lg group"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${isSpecial
                        ? 'bg-blue-600/80'
                        : 'bg-gray-800/60 group-hover:bg-gray-700/60'
                        }`}>
                        <span className="text-lg">{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {title}
                        </h3>
                        {isSpecial && (
                            <p className="text-xs text-purple-300/70 font-medium mt-1">
                                Essential project information
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${isExpanded ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700/40 text-gray-500'
                        }`}>
                        <svg
                            className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6">
                    <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/20">
                        <div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
                            {content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sidebar Navigation Component
const SidebarNavigation = ({ sections, selectedSection, onSectionSelect, isModifying }) => {
    return (
        <div className="w-64 bg-black border-r border-gray-800/60 h-full flex flex-col">
            <div className="p-4 border-b border-gray-800/60 shrink-0">
                <h3 className="text-lg font-semibold text-white mb-1">Project Sections</h3>
                <p className="text-xs text-gray-500">Select a section to view or modify</p>
            </div>

            {/* Scrollable sections container */}
            <div className="overflow-y-auto flex-1 p-3 space-y-1.5 custom-scrollbar">
                {sections.filter(section => section.content.trim()).map((section) => (
                    <button
                        key={section.id}
                        onClick={() => onSectionSelect(section.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${selectedSection === section.id
                            ? 'bg-gray-900 border border-gray-700 text-white shadow-lg'
                            : 'bg-black/80 border border-gray-800/60 text-gray-300 hover:bg-gray-900/60 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="text-base opacity-80">{section.icon}</span>
                            <div className="flex-1 truncate">
                                <div className="font-medium text-sm truncate">{section.title}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {Math.min(section.content.split('\n').length, 99)}+ lines
                                </div>
                            </div>
                            {isModifying && selectedSection === section.id && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Footer with subtle branding */}
            <div className="p-3 border-t border-gray-800/60 text-center">
                <p className="text-xs text-gray-600">
                    Project Idea Generator
                </p>
            </div>
        </div>
    );
};

// Component for chat-based overall idea modification
const ChatModificationInterface = ({ onModifyIdea, isLoading, user }) => {
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const chatInputRef = useRef(null);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isLoading || !user) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: chatInput.trim(),
            timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, userMessage]);
        const prompt = chatInput.trim();
        setChatInput('');

        try {
            const result = await onModifyIdea(prompt);
            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Idea successfully modified based on your request.',
                timestamp: new Date().toISOString()
            };
            setChatHistory(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'error',
                content: 'Failed to modify idea. Please try again.',
                timestamp: new Date().toISOString()
            };
            setChatHistory(prev => [...prev, errorMessage]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (isMinimized) {
            // Focus the input when maximizing
            setTimeout(() => {
                if (chatInputRef.current) {
                    chatInputRef.current.focus();
                }
            }, 100);
        }
    };

    return (
        <div className="relative">
            {/* Header bar - always visible */}
            <div className="flex items-center justify-between bg-black border-b border-gray-800/60 px-3 py-2">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-lg">💬</span>
                    <h3 className="font-medium text-gray-300 text-sm">Modify Entire Idea</h3>
                </div>
                <div className="flex items-center gap-1">
                    {chatHistory.length > 0 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-900"
                        >
                            {isExpanded ? 'Hide History' : 'Show History'} ({chatHistory.length})
                        </button>
                    )}
                    <button
                        onClick={toggleMinimize}
                        className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-900"
                    >
                        {isMinimized ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {/* Collapsible content */}
            {!isMinimized && (
                <div className="space-y-2 px-3 py-2">
                    {/* Chat History (expandable) */}
                    {isExpanded && chatHistory.length > 0 && (
                        <div className="bg-black rounded-lg p-2 max-h-40 overflow-y-auto space-y-2 border border-gray-800/60">
                            {chatHistory.map((message) => (
                                <div key={message.id} className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'
                                    }`}>
                                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-xs ${message.type === 'user'
                                        ? 'bg-gray-900 border border-gray-800 text-gray-300'
                                        : message.type === 'error'
                                            ? 'bg-black border border-red-900/50 text-red-400'
                                            : 'bg-black border border-gray-800 text-gray-400'
                                        }`}>
                                        <p>{message.content}</p>
                                        <p className="text-xs opacity-60 mt-1 text-gray-600">
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Chat Input */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <textarea
                                ref={chatInputRef}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="How would you like to modify the idea? (Press Enter to send)"
                                className="w-full bg-black border border-gray-800/60 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-gray-700 resize-none text-xs"
                                rows={1}
                                disabled={isLoading || !user}
                            />
                            {!user && (
                                <p className="text-xs text-gray-600 mt-1">Please log in to modify ideas</p>
                            )}
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isLoading || !user}
                            className="px-3 py-1 bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-gray-300 rounded-lg transition-colors flex items-center gap-1 self-end h-8 border border-gray-800/60"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-2 h-2 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                                    <span className="text-xs">Working...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs">Send</span>
                                    <span className="text-xs opacity-60">↵</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// SectionEditor Component
const SectionEditor = ({ section, onUpdate, onModify, isLoading }) => {
    const [modifyPrompt, setModifyPrompt] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Handle checkbox clicks in rendered markdown
    const handleContentClick = (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            // Find which checkbox index this is
            const checkboxes = Array.from(e.currentTarget.querySelectorAll('input[type="checkbox"]'));
            const index = checkboxes.indexOf(e.target);

            if (index !== -1 && onUpdate) {
                // Find corresponding checkbox in markdown source
                let currentIndex = 0;
                // Regex matches '- [ ]' or '- [x]'
                const newContent = section.content.replace(/- \[[ x]\]/g, (match) => {
                    if (currentIndex === index) {
                        currentIndex++;
                        // Toggle state
                        return match === '- [ ]' ? '- [x]' : '- [ ]';
                    }
                    currentIndex++;
                    return match;
                });
                onUpdate(newContent);
            }
        }
    };

    const handleModify = () => {
        if (modifyPrompt.trim() && !isLoading) {
            onModify(section.id, modifyPrompt);
            setModifyPrompt('');
        }
    };

    // Parse Markdown if marked is available, otherwise basic formatting
    const getMarkdownContent = () => {
        if (window.marked) {
            let html = window.marked.parse(section.content);
            // Enable checkboxes for interactivity by removing disabled attribute
            html = html.replace(/disabled=""/g, '').replace(/disabled/g, '');
            return { __html: html };
        }
        // Fallback for missing library
        return { __html: section.content.replace(/\n/g, '<br/>') };
    };

    return (
        <div className="w-full max-w-6xl px-6 md:px-10 py-6">
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-3 mb-5">
                <div className="flex items-center gap-3">
                    <div className="text-xl text-gray-400">{section.icon}</div>
                    <h2 className="text-xl font-bold text-gray-200">{section.title}</h2>
                </div>
                <div>
                    <IconButton
                        iconType="edit"
                        tooltip="Modify Section"
                        onClick={() => setIsExpanded(!isExpanded)}
                        variant={isExpanded ? 'primary' : 'default'}
                        className={isExpanded
                            ? 'bg-black border border-gray-700 text-gray-300'
                            : 'bg-black border border-gray-800/60 text-gray-500 hover:text-gray-300'}
                    />
                </div>
            </div>

            {/* Section Content */}
            <div
                className="max-w-none mb-6 text-gray-300 prose prose-invert prose-p:text-gray-300 prose-headings:text-gray-200 prose-a:text-blue-400 prose-strong:text-white prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-gray-500"
                onClick={handleContentClick}
            >
                {/* Special styling for Project Title & Overview */}
                {section.title.toLowerCase().includes('title') && section.title.toLowerCase().includes('overview') ? (
                    <div>
                        {(() => {
                            const lines = section.content.split('\n').filter(l => l.trim());
                            const title = lines[0];
                            const description = lines.slice(1).join('\n');

                            // Check if the first line is actually a title (not a header marker)
                            const cleanTitle = title.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, '');

                            return (
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 leading-tight">
                                        {cleanTitle}
                                    </h1>
                                    <div className="text-lg md:text-xl text-gray-300 leading-relaxed font-light">
                                        <div dangerouslySetInnerHTML={{
                                            __html: window.marked
                                                ? window.marked.parse(description)
                                                : description
                                        }} />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div dangerouslySetInnerHTML={getMarkdownContent()} />
                )}
            </div>

            {/* Modification Interface (expandable) */}
            {isExpanded && (
                <div className="bg-black border border-gray-800/60 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Modify this section</h3>
                    <div className="space-y-3">
                        <textarea
                            value={modifyPrompt}
                            onChange={(e) => setModifyPrompt(e.target.value)}
                            placeholder={`How would you like to modify the ${section.title} section?`}
                            className="w-full bg-black border border-gray-800/60 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-gray-700 resize-none text-sm"
                            rows={3}
                            disabled={isLoading}
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleModify}
                                disabled={!modifyPrompt.trim() || isLoading}
                                className="px-3 py-1.5 bg-black hover:bg-gray-900 border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-gray-300 rounded-lg transition-colors flex items-center gap-2 text-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                                        <span>Modifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Apply Changes</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Enhanced Project Idea Display Component with Modification System
const ProjectIdeaDisplay = ({ idea, onStartNew, user, hideHeader = false, customHeaderActions = null, userProfile, onNavigate, onLogout, onDiscoveryMode, theme }) => {
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [isModifying, setIsModifying] = useState(false);
    const [currentIdea, setCurrentIdea] = useState(idea);
    const [modificationHistory, setModificationHistory] = useState([]);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [generationOperationId, setGenerationOperationId] = useState(null);
    const [codePreviewData, setCodePreviewData] = useState(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initialize Markdown Renderer
    useEffect(() => {
        if (window.marked) {
            window.marked.setOptions({
                breaks: true,
                gfm: true
            });
        }
    }, []);

    // Export PDF Handler
    const handleExportPDF = async () => {
        if (!window.html2pdf) return;
        setExportLoading(true);
        // Target the hidden full-content container
        const element = document.getElementById('project-idea-pdf-export');

        // Temporarily make it visible for capture (off-screen)
        // Note: html2pdf clones the element, so as long as it's rendered, it should work.
        // If it's display:none, it might be empty. Ideally we position it absolute off-screen.

        const opt = {
            margin: 0.5,
            filename: `pideas-${currentIdea.substring(0, 20).trim()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            await window.html2pdf().set(opt).from(element).save();
        } finally {
            setExportLoading(false);
        }
    };

    // Copy Markdown Handler
    const handleCopyMarkdown = () => {
        navigator.clipboard.writeText(currentIdea).then(() => {
            alert('Project Idea copied to clipboard!');
        });
    };

    // Parse the idea text into sections
    useEffect(() => {
        if (!currentIdea) return;

        const lines = currentIdea.split('\n');
        const parsedSections = [];
        let currentSection = null;
        let titleSection = null;
        let overviewSection = null;

        lines.forEach((line, index) => {
            // Check if line is a section header (starts with ##)
            if (line.trim().startsWith('##')) {
                // Save previous section if exists
                if (currentSection) {
                    const titleLower = currentSection.title.toLowerCase();
                    if (titleLower.includes('title')) {
                        titleSection = currentSection;
                    } else if (titleLower.includes('overview')) {
                        overviewSection = currentSection;
                    } else {
                        // Only add sections with content
                        if (currentSection.content.trim()) {
                            parsedSections.push(currentSection);
                        }
                    }
                }

                // Start new section
                const title = line.replace(/^#+\s*/, '').trim();
                currentSection = {
                    id: `section-${Date.now()}-${Math.random()}`,
                    title,
                    content: '',
                    icon: getSectionIcon(title)
                };
            } else if (currentSection && line.trim()) {
                // Add content to current section
                currentSection.content += (currentSection.content ? '\n' : '') + line;
            } else if (!currentSection && line.trim()) {
                // Content before first section
                if (parsedSections.length === 0) {
                    parsedSections.unshift({
                        id: 'intro',
                        title: 'Project Introduction',
                        content: line,
                        icon: '📋'
                    });
                }
            }
        });

        // Add final section
        if (currentSection) {
            const titleLower = currentSection.title.toLowerCase();
            if (titleLower.includes('title')) {
                titleSection = currentSection;
            } else if (titleLower.includes('overview')) {
                overviewSection = currentSection;
            } else {
                // Only add sections with content
                if (currentSection.content.trim()) {
                    parsedSections.push(currentSection);
                }
            }
        }

        // Combine title and overview sections
        if (titleSection || overviewSection) {
            const combinedContent = [
                titleSection?.content || '',
                overviewSection?.content || ''
            ].filter(Boolean).join('\n\n');

            // Only add combined section if it has content
            if (combinedContent.trim()) {
                const combinedSection = {
                    id: 'title-overview',
                    title: 'Project Title & Overview',
                    content: combinedContent,
                    icon: '💡',
                    isSpecial: true
                };

                parsedSections.unshift(combinedSection);
            }
        }

        setSections(parsedSections);

        // Select first section by default
        if (parsedSections.length > 0 && !selectedSection) {
            setSelectedSection(parsedSections[0].id);
        }
    }, [currentIdea]);

    // Get appropriate icon for section
    const getSectionIcon = (title) => {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('title')) return '📝';
        if (titleLower.includes('overview')) return '📋';
        if (titleLower.includes('objective') || titleLower.includes('learning')) return '🎯';
        if (titleLower.includes('technical') || titleLower.includes('requirement')) return '⚙️';
        if (titleLower.includes('structure') || titleLower.includes('phase')) return '🏗️';
        if (titleLower.includes('deliverable')) return '📦';
        if (titleLower.includes('implementation') || titleLower.includes('guide')) return '🚀';
        if (titleLower.includes('variation') || titleLower.includes('extension')) return '🔄';
        return '📄';
    };

    // Handle manual section update (e.g., checkbox toggle)
    const handleSectionUpdate = (sectionId, newContent) => {
        const updatedSections = sections.map(s =>
            s.id === sectionId ? { ...s, content: newContent } : s
        );

        // We update the local sections state immediately for responsiveness
        setSections(updatedSections);

        // Reconstruct the full idea string to ensure consistency (and persistence if we were saving)
        // We use the special "title-overview" id logic used in parsing
        const reconstructedIdea = updatedSections.map(s => {
            if (s.id === 'intro') return s.content;
            if (s.id === 'title-overview') {
                // If it's the combined section, we assume the title is "Project Title & Overview"
                // The content usually has the ## headers inside if it was split, 
                // but here 's.content' is just the raw text of the combined section.
                // However, the parser logic creates 'content' for title-overview by joining titleSection and overviewSection.
                // If we edited it, we just put it back. 
                // But wait, the section title in 's.title' is just "Project Title & Overview".
                // We need to valid heading format. 
                // Simplest is to just print the content if it already has headers, 
                // OR wrap it if it doesn't. 
                // Given the parser joins them with \n\n, and they originally had no headers in 'content' (headers were stripped?),
                // Let's look at the parser: 
                // title = line.replace(/^#+\s*/, '').trim(); 
                // So 'content' does NOT have the header. 
                // So we definitely need to prepend the header.
                return `## ${s.title}\n${s.content}`;
            }
            return `## ${s.title}\n${s.content}`;
        }).join('\n\n');

        setCurrentIdea(reconstructedIdea);
    };

    // Handle section modification
    const handleSectionModify = async (sectionId, modificationPrompt) => {
        if (!user) {
            alert('Please log in to modify ideas.');
            return;
        }

        setIsModifying(true);

        try {
            const section = sections.find(s => s.id === sectionId);
            if (!section) return;

            // Add to modification history
            const modification = {
                id: Date.now(),
                sectionId,
                sectionTitle: section.title,
                prompt: modificationPrompt,
                timestamp: new Date().toISOString(),
                originalContent: section.content
            };
            setModificationHistory(prev => [...prev, modification]);

            // Call backend to modify the section
            const modifySection = firebase.functions().httpsCallable('modifyIdeaSection');
            const result = await modifySection({
                userId: user.uid,
                originalIdea: currentIdea,
                sectionTitle: section.title,
                sectionContent: section.content,
                modificationPrompt: modificationPrompt
            });

            if (result.data.success) {
                // Update the current idea with the modified section
                setCurrentIdea(result.data.modifiedIdea);

                // Auto-save the modified idea to history
                const saveToHistory = firebase.functions().httpsCallable('saveIdeaToHistory');
                await saveToHistory({
                    userId: user.uid,
                    idea: result.data.modifiedIdea,
                    context: {
                        modification: true,
                        modifiedSection: section.title,
                        modificationPrompt: modificationPrompt
                    }
                });
            } else {
                throw new Error(result.data.error || 'Failed to modify section');
            }
        } catch (error) {
            console.error('Error modifying section:', error);
            alert('Failed to modify section. Please try again.');
        } finally {
            setIsModifying(false);
        }
    };

    // Handle section selection
    const handleSectionSelect = (sectionId) => {
        setSelectedSection(sectionId);
    };

    // Get selected section
    const selectedSectionData = sections.find(s => s.id === selectedSection);

    // Reset to original idea
    const handleResetToOriginal = () => {
        if (confirm('Are you sure you want to reset to the original idea? All modifications will be lost.')) {
            setCurrentIdea(idea);
            setModificationHistory([]);
        }
    };

    // Handle overall idea modification via chat
    const handleOverallIdeaModify = async (modificationPrompt) => {
        if (!user) {
            throw new Error('Please log in to modify ideas.');
        }

        setIsModifying(true);

        try {
            // Add to modification history
            const modification = {
                id: Date.now(),
                sectionId: 'overall',
                sectionTitle: 'Overall Idea',
                prompt: modificationPrompt,
                timestamp: new Date().toISOString(),
                originalContent: currentIdea
            };
            setModificationHistory(prev => [...prev, modification]);

            // Call backend to modify the entire idea
            const modifySection = firebase.functions().httpsCallable('modifyIdeaSection');
            const result = await modifySection({
                userId: user.uid,
                originalIdea: currentIdea,
                sectionTitle: 'Overall Project Idea',
                sectionContent: currentIdea,
                modificationPrompt: modificationPrompt
            });

            if (result.data.success) {
                // Update the current idea with the modified version
                setCurrentIdea(result.data.modifiedIdea);

                // Auto-save the modified idea to history
                const saveToHistory = firebase.functions().httpsCallable('saveIdeaToHistory');
                await saveToHistory({
                    userId: user.uid,
                    idea: result.data.modifiedIdea,
                    context: {
                        modification: true,
                        modifiedSection: 'Overall Idea',
                        modificationPrompt: modificationPrompt
                    }
                });

                return result.data.modifiedIdea;
            } else {
                throw new Error(result.data.error || 'Failed to modify idea');
            }
        } catch (error) {
            console.error('Error modifying overall idea:', error);
            throw error;
        } finally {
            setIsModifying(false);
        }
    };

    return (
        <div className="h-full bg-black relative overflow-hidden flex flex-col">
            {/* Background particles effect */}
            <div className="fixed inset-0 z-0">
                <ParticleSystem theme={theme} />
            </div>

            {generationOperationId && <CodeGenerationLoadingScreen operationId={generationOperationId} theme={theme} />}
            {codePreviewData && <CodePreviewBrowser
                previewUrl={codePreviewData.previewUrl}
                downloadUrl={codePreviewData.downloadUrl}
                theme={theme}
                onClose={() => setCodePreviewData(null)}
            />}

            {/* Header - Matching AppScreen style - Only shown when not in DiscoveryResult */}
            {!hideHeader && (
                <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800 p-4 relative z-10">
                    <div className="w-full px-6 flex justify-between items-center">
                        <button
                            onClick={() => onStartNew ? onStartNew() : (onNavigate && onNavigate('welcome'))}
                            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                        >
                            <h1 className="text-2xl font-bold text-white">Pideas</h1>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-300">Your Personalized Project Idea</span>
                        </button>
                        <div className="flex items-center gap-4">
                            <IconButton
                                iconType="history"
                                tooltip="History"
                                onClick={() => onNavigate && onNavigate('history')}
                                variant="default"
                            />
                            {user && user.role === 'admin' && (
                                <IconButton
                                    iconType="admin"
                                    tooltip="Admin Console"
                                    onClick={() => onNavigate && onNavigate('admin')}
                                    variant="admin"
                                />
                            )}

                            {customHeaderActions ? (
                                // Render custom actions (e.g., for Discovery mode)
                                customHeaderActions
                            ) : (
                                // Render standard actions
                                <>
                                    {modificationHistory.length > 0 && (
                                        <IconButton
                                            iconType="reset"
                                            tooltip="Reset to Original"
                                            onClick={handleResetToOriginal}
                                            variant="default"
                                            className="text-gray-400 hover:text-white bg-black hover:bg-gray-900 border border-gray-800/60"
                                        />
                                    )}
                                    <IconButton
                                        iconType="idea"
                                        tooltip="Generate New Idea"
                                        onClick={onStartNew}
                                        variant="primary"
                                        className="bg-black border border-gray-800 hover:bg-gray-900 text-gray-300 hover:text-white"
                                    />
                                    <button
                                        onClick={onDiscoveryMode}
                                        className="bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 border border-purple-800/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <span>🚀</span>
                                        <span className="hidden md:inline">Discovery Mode</span>
                                    </button>
                                </>
                            )}

                            {/* Export Buttons (Desktop) */}
                            <div className="hidden md:flex gap-2 border-l border-gray-800 pl-4 ml-4">
                                <button
                                    onClick={handleCopyMarkdown}
                                    className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2"
                                >
                                    <span>📋</span>
                                    <span>Copy MD</span>
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={exportLoading}
                                    className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {exportLoading ? (
                                        <div className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span>📄</span>
                                    )}
                                    <span>Export PDF</span>
                                </button>
                            </div>

                            <button
                                onClick={async () => {
                                    if (isGeneratingCode) return;
                                    setIsGeneratingCode(true);
                                    const opId = crypto.randomUUID();
                                    setGenerationOperationId(opId);

                                    try {
                                        const generateCodebase = firebase.functions().httpsCallable('generate_codebase', { timeout: 540000 });
                                        const result = await generateCodebase({ idea: currentIdea, operationId: opId });

                                        if (result.data.success) {
                                            setCodePreviewData({
                                                previewUrl: result.data.previewUrl,
                                                downloadUrl: result.data.downloadUrl
                                            });
                                        } else {
                                            alert("Error generating codebase: " + result.data.error);
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert("Failed to call generation function.");
                                    } finally {
                                        setIsGeneratingCode(false);
                                        setGenerationOperationId(null);
                                    }
                                }}
                                disabled={isGeneratingCode}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-blue-500"
                            >
                                {isGeneratingCode ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Building...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>⬇️ Generate Code</span>
                                    </>
                                )}
                            </button>

                            {/* User profile section */}
                            <div className="relative flex items-center">
                                <UserProfileIcon onClick={() => setShowProfileDropdown(!showProfileDropdown)} />

                                {/* User profile dropdown */}
                                {showProfileDropdown && ReactDOM.createPortal(
                                    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }}>
                                        <div className="absolute right-0 top-[60px] mr-4" style={{ pointerEvents: 'auto' }}>
                                            <UserProfileDropdown
                                                user={user}
                                                userProfile={userProfile || {}}
                                                onClose={() => setShowProfileDropdown(false)}
                                                onLogout={onLogout}
                                                onEditProfile={() => {
                                                    setShowProfileDropdown(false);
                                                    setShowProfileEditor(true);
                                                }}
                                            />
                                        </div>
                                    </div>,
                                    document.body
                                )}

                                {showProfileEditor && ReactDOM.createPortal(
                                    <ProfileEditor
                                        user={user}
                                        currentProfile={userProfile || {}}
                                        onClose={() => setShowProfileEditor(false)}
                                        onSave={async (updates) => {
                                            // Profile save logic would need to be passed down or handled here
                                            // For now, simpler to just close
                                            setShowProfileEditor(false);
                                            alert('Please update profile from main page for now.');
                                        }}
                                        isLoading={false}
                                    />,
                                    document.body
                                )}
                            </div>

                            <IconButton
                                iconType="logout"
                                tooltip="Logout"
                                onClick={() => {
                                    if (onLogout) onLogout();
                                    else if (typeof firebase !== 'undefined') {
                                        firebase.auth().signOut();
                                        window.location.reload();
                                    }
                                }}
                                variant="default"
                            />
                        </div>
                    </div>
                </header>
            )
            }

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex overflow-hidden">
                {/* Sidebar - Fixed width with dark theme */}
                <div className="w-64 bg-black border-r border-gray-800/60 flex-shrink-0">
                    <SidebarNavigation
                        sections={sections}
                        selectedSection={selectedSection}
                        onSectionSelect={handleSectionSelect}
                        isModifying={isModifying}
                    />
                </div>

                {/* Main Content Area with Chat */}
                <div className="flex-1 flex flex-col bg-black relative" id="project-idea-content">
                    {/* Content Display Area - scrollbar-gutter prevents layout shift */}
                    <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pb-40">
                        {selectedSectionData ? (
                            <div>
                                <SectionEditor
                                    section={selectedSectionData}
                                    onModify={handleSectionModify}
                                    isLoading={isModifying}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-5 bg-black rounded-full flex items-center justify-center border border-gray-800/60">
                                        <div className="text-3xl opacity-60">📋</div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Select a Section</h3>
                                    <p className="text-gray-500 max-w-md">Choose a section from the sidebar to view and modify</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Check if user has explicit 'admin' role or is owner */}
                    {/* Floating Chat Interface */}
                    {/* Responsive Chat Interface */}
                    {isMobile ? (
                        <>
                            {/* Mobile Sticky Bar */}
                            {!isDrawerOpen && (
                                <div
                                    className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 z-30 cursor-pointer safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
                                    onClick={() => setIsDrawerOpen(true)}
                                >
                                    <div className="bg-gray-800 rounded-full px-4 py-3 text-gray-400 flex items-center justify-between border border-gray-700 shadow-lg">
                                        <span>💬 Modify this project...</span>
                                        <span className="bg-purple-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs shadow-lg shadow-purple-900/50">↑</span>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Drawer */}
                            <div className={`fixed inset-x-0 bottom-0 bg-gray-900 border-t border-gray-800 z-[9999] transition-transform duration-300 ease-out transform ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'} rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col`} style={{ height: '70vh' }}>
                                {/* Drawer Handle/Header */}
                                <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-2xl cursor-pointer" onClick={() => setIsDrawerOpen(false)}>
                                    <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto" />
                                </div>
                                <div className="flex-1 overflow-hidden p-0 relative">
                                    <ChatModificationInterface
                                        onModifyIdea={handleOverallIdeaModify}
                                        isLoading={isModifying}
                                        user={user}
                                    />
                                </div>
                            </div>

                            {/* Drawer Backdrop */}
                            {isDrawerOpen && (
                                <div className="fixed inset-0 bg-black/80 z-[9990] backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
                            )}
                        </>
                    ) : (
                        /* Desktop Floating Interface */
                        <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center pointer-events-none z-20">
                            <div className="w-full max-w-3xl pointer-events-auto shadow-2xl shadow-blue-900/10">
                                <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden ring-1 ring-white/10">
                                    <ChatModificationInterface
                                        onModifyIdea={handleOverallIdeaModify}
                                        isLoading={isModifying}
                                        user={user}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modification History Panel (if any modifications) */}
            {
                modificationHistory.length > 0 && (
                    <div className="bg-black border-t border-gray-800/60 p-3">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-400">Modification History:</span>
                                <span className="text-xs text-gray-500">({modificationHistory.length} changes)</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {modificationHistory.map((mod) => (
                                    <div key={mod.id} className="flex-shrink-0 bg-black rounded-lg p-3 border border-gray-800/60 min-w-64">
                                        <div className="text-xs font-medium text-gray-400">{mod.sectionTitle}</div>
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{mod.prompt}</div>
                                        <div className="text-xs text-gray-600 mt-2">
                                            {new Date(mod.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Hidden container for PDF Export - Renders all sections */}
            <div id="project-idea-pdf-export" className="absolute top-0 left-[-9999px] width-[800px] bg-white text-black p-8">
                <h1 className="text-3xl font-bold mb-2">Project Idea: {currentIdea.split('\n')[0].replace('#', '').trim() || 'Custom Project'}</h1>
                <p className="text-gray-500 mb-8 border-b pb-4">Generated by Pideas AI</p>

                <div className="space-y-8">
                    {sections.map(section => (
                        <div key={section.id} className="pdf-section mb-6 break-inside-avoid">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
                                <span>{section.icon}</span>
                                <span>{section.title}</span>
                            </h2>
                            {/* Render content using the same MarkDown logic but black text for PDF */}
                            <div className="prose prose-sm max-w-none text-black">
                                <div dangerouslySetInnerHTML={{
                                    __html: window.marked
                                        ? window.marked.parse(section.content || '')
                                        : section.content
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

// History Component with Redesigned Glassmorphism UI
const HistoryView = ({ user, onBack, onViewIdea }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
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
                }
            } catch (error) {
                console.error('Error loading history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    // Helper to extract a clean title from the raw text
    const getProjectTitle = (item) => {
        if (!item.idea || typeof item.idea !== 'string') {
            // Fallback to query
            const titleMatch = item.query.match(/for:\s*["']([^"']+)["']/i);
            if (titleMatch) return titleMatch[1];
            return item.query.length > 50 ? item.query.substring(0, 50) + '...' : item.query;
        }

        const lines = item.idea.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Strategy 1: Look for "## PROJECT TITLE" followed by a bold line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this line is a generic header
            if (line.toUpperCase().includes('PROJECT TITLE') && line.startsWith('#')) {
                // Look at the next non-empty line
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1];
                    const boldMatch = nextLine.match(/\*\*(.*?)\*\*/); // Look for bold text anywhere in the line
                    if (boldMatch) {
                        return boldMatch[1].replace(/:$/, '').trim();
                    }
                    // If not bold, maybe just the text itself?
                    return nextLine.replace(/:$/, '').trim();
                }
            }
        }

        // Strategy 2: Look for the first H1 header that ISN'T generic
        for (const line of lines) {
            if (line.startsWith('#')) {
                const headerText = line.replace(/^#+\s*/, '').trim();
                if (headerText.toUpperCase() !== 'PROJECT TITLE') {
                    return headerText;
                }
            }
        }

        // Strategy 3: Just find the first bold text that isn't "PROJECT TITLE"
        const boldMatch = item.idea.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
            const extracted = boldMatch[1].replace(/:$/, '').trim();
            if (extracted.toUpperCase() !== 'PROJECT TITLE') {
                return extracted;
            }
        }

        // Fallback: Query analysis
        const titleMatch = item.query.match(/for:\s*["']([^"']+)["']/i);
        if (titleMatch) return titleMatch[1];

        return item.query.length > 50 ? item.query.substring(0, 50) + '...' : item.query;
    };

    // Helper to get a short preview text
    const getPreviewText = (item) => {
        if (item.idea && typeof item.idea === 'string') {
            // Remove headers and extra whitespace
            const text = item.idea.replace(/#+\s.*$/mg, '').replace(/\n+/g, ' ').trim();
            return text.substring(0, 120) + '...';
        }
        return "Click to view project details.";
    };

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
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Your Project History</h2>
                    <p className="text-gray-400">Review your past generated ideas and plans</p>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 border border-gray-700/50"
                >
                    <span>←</span>
                    <span>Back to Generator</span>
                </button>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🌱</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                        Start your journey by generating your first personalized project idea!
                    </p>
                    <button
                        onClick={onBack}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        Generate New Idea
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onViewIdea(item.idea)}
                            className="group relative bg-gray-900/40 backdrop-blur-md border border-gray-800/60 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
                        >
                            {/* Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Header: Score & Date */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-gray-800">
                                    <span className="text-xs text-gray-400">Score</span>
                                    <span className="text-sm font-bold text-green-400">{item.gameScore}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                    {new Date(item.generatedAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 relative z-10 group-hover:text-blue-400 transition-colors">
                                {getProjectTitle(item)}
                            </h3>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                                <span className="text-xs px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    {item.studentProfile?.stream || 'General'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                    {item.studentProfile?.skillLevel || 'Beginner'}
                                </span>
                            </div>

                            {/* Preview Text */}
                            <p className="text-sm text-gray-400 line-clamp-3 mb-6 relative z-10">
                                {getPreviewText(item)}
                            </p>

                            {/* Footer Action */}
                            <div className="flex items-center text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform relative z-10">
                                View Full Plan
                                <span className="ml-1 transition-transform group-hover:ml-2">→</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// User Profile Icon Component
const UserProfileIcon = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 rounded-full bg-black flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-all duration-200"
            aria-label="Open user profile"
        >
            <div className="w-8 h-8 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path
                        d="M50,15 C60,15 70,25 70,40 C70,47 65,55 60,58 C57,60 55,62 55,65 L55,70 C55,72 53,75 50,75 C47,75 45,72 45,70 L45,65 C45,62 43,60 40,58 C35,55 30,47 30,40 C30,25 40,15 50,15 Z"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <circle cx="40" cy="40" r="5" fill="#4ade80" />
                    <circle cx="60" cy="40" r="5" fill="#4ade80" />
                    <path
                        d="M35,80 C35,80 40,85 50,85 C60,85 65,80 65,80"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </button>
    );
};

// Profile Editor Modal Component
const ProfileEditor = ({ user, currentProfile, onClose, onSave, isLoading }) => {
    const [name, setName] = useState(user.displayName || '');
    const [bio, setBio] = useState(currentProfile?.bio || '');
    const [location, setLocation] = useState(currentProfile?.location || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                displayName: name,
                bio,
                location
            });
            onClose();
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <CloseIcon size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-zinc-400 text-sm mb-1">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-zinc-400 text-sm mb-1">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Coding Galaxy"
                        />
                    </div>

                    <div>
                        <label className="block text-zinc-400 text-sm mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none h-24"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving || isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Enhanced User Profile Dropdown Component with 3D Effects
const UserProfileDropdown = ({ user, userProfile, userRole, onClose, onLogout, onEditProfile }) => {
    const dropdownRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
    const [targetTilt, setTargetTilt] = useState({ x: 0, y: 0 });
    const animationFrameRef = useRef();
    const lastUpdateTimeRef = useRef(0);

    // Linear interpolation function
    const lerp = (start, end, factor) => {
        return start + (end - start) * factor;
    };

    // Smooth tilt animation using requestAnimationFrame
    const updateTilt = useCallback(() => {
        const now = performance.now();
        const deltaTime = now - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = now;

        setCardTilt((current) => {
            const lerpFactor = Math.min(deltaTime / 16, 1) * 0.15;
            const newX = lerp(current.x, targetTilt.x, lerpFactor);
            const newY = lerp(current.y, targetTilt.y, lerpFactor);

            const threshold = 0.1;
            return {
                x: Math.abs(newX - targetTilt.x) < threshold ? targetTilt.x : newX,
                y: Math.abs(newY - targetTilt.y) < threshold ? targetTilt.y : newY,
            };
        });

        if (isHovered) {
            animationFrameRef.current = requestAnimationFrame(updateTilt);
        }
    }, [targetTilt, isHovered]);

    // Mouse move handler for 3D tilt effect
    const handleMouseMove = useCallback((e) => {
        if (dropdownRef.current && isHovered) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            // Calculate tilt angles (max 8 degrees for subtle effect)
            const maxTilt = 8;
            const tiltX = (mouseY / (rect.height / 2)) * maxTilt * -1;
            const tiltY = (mouseX / (rect.width / 2)) * maxTilt;

            const constrainedTiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
            const constrainedTiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY));

            setTargetTilt({ x: constrainedTiltX, y: constrainedTiltY });

            // Calculate mouse position as percentage for gradients
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setMousePosition({
                x: Math.max(0, Math.min(100, x)),
                y: Math.max(0, Math.min(100, y)),
            });
        }
    }, [isHovered]);

    // Generate holographic gradient based on mouse position and tilt
    const getHolographicStyle = () => {
        if (!isHovered) {
            return {
                background: 'transparent',
                transition: 'background 0.15s ease-out',
            };
        }

        const { x, y } = mousePosition;
        const { x: tiltX, y: tiltY } = cardTilt;

        const tiltIntensity = (Math.abs(tiltX) + Math.abs(tiltY)) / 16;
        const colorIntensity = 0.4 + tiltIntensity * 0.3;

        const tiltOffsetX = tiltY * 2;
        const tiltOffsetY = tiltX * 2;

        const adjustedX = Math.max(0, Math.min(100, x + tiltOffsetX));
        const adjustedY = Math.max(0, Math.min(100, y + tiltOffsetY));

        const gradient1 = `radial-gradient(circle at ${adjustedX}% ${adjustedY}%, rgba(220, 160, 225, ${colorIntensity}) 0%, transparent 50%)`;
        const gradient2 = `radial-gradient(circle at ${100 - adjustedX}% ${100 - adjustedY}%, rgba(30, 210, 220, ${colorIntensity * 0.8}) 0%, transparent 40%)`;
        const gradient3 = `radial-gradient(circle at ${adjustedX}% ${100 - adjustedY}%, rgba(60, 230, 65, ${colorIntensity * 0.9}) 0%, transparent 45%)`;

        return {
            background: `${gradient1}, ${gradient2}, ${gradient3}`,
            transition: 'none',
        };
    };

    useEffect(() => {
        // Handle click outside to close dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        // Handle escape key to close dropdown
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Add event listeners
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);
        document.addEventListener('mousemove', handleMouseMove, { passive: true });

        // Clean up event listeners
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
            document.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [onClose, handleMouseMove]);

    // Animation frame management
    useEffect(() => {
        if (isHovered) {
            lastUpdateTimeRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(updateTilt);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isHovered, updateTilt]);

    // Handle logout click
    const handleLogout = (e) => {
        e.preventDefault();
        onClose();
        onLogout();
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
            style={{
                transformOrigin: 'top right',
                animation: 'fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                right: '0',
                maxWidth: 'calc(100vw - 20px)',
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
                transition: 'transform 0.1s ease-out'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setMousePosition({ x: 50, y: 50 });
                setCardTilt({ x: 0, y: 0 });
                setTargetTilt({ x: 0, y: 0 });
            }}
        >
            <div className="relative overflow-hidden rounded-xl">
                {/* Cosmic gradient header */}
                <div className="h-32 relative bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-teal-900/50 rounded-t-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/30 to-transparent rounded-t-xl"></div>

                    {/* Holographic overlay */}
                    <div
                        className="absolute inset-0 rounded-t-xl mix-blend-screen opacity-60"
                        style={getHolographicStyle()}
                    ></div>
                </div>

                {/* Profile content */}
                <div className="relative -mt-12 z-10 px-6 pb-6">
                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-zinc-800 flex items-center justify-center relative">
                            <div className="w-16 h-16">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <path
                                        d="M50,15 C60,15 70,25 70,40 C70,47 65,55 60,58 C57,60 55,62 55,65 L55,70 C55,72 53,75 50,75 C47,75 45,72 45,70 L45,65 C45,62 43,60 40,58 C35,55 30,47 30,40 C30,25 40,15 50,15 Z"
                                        fill="none"
                                        stroke="#1DED83"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="40" cy="40" r="5" fill="#1DED83" />
                                    <circle cx="60" cy="40" r="5" fill="#1DED83" />
                                    <path
                                        d="M35,80 C35,80 40,85 50,85 C60,85 65,80 65,80"
                                        fill="none"
                                        stroke="#1DED83"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* User info */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-1 font-mono">{user.displayName}</h1>
                        <p className="text-zinc-400 text-sm font-mono">{userRole?.isAdmin ? 'Administrator' : 'Member'}</p>

                        {/* Location */}
                        {userProfile?.location && (
                            <div className="flex items-center justify-center gap-2 mt-3 animate-fade-in">
                                <svg className="w-4 h-4" style={{ color: '#1DED83' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-mono text-white text-sm">{userProfile.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Bio */}
                    {userProfile?.bio && (
                        <div className="text-center mb-6 animate-fade-in">
                            <p className="text-zinc-300 leading-relaxed font-mono text-xs">
                                {userProfile.bio}
                            </p>
                        </div>
                    )}

                    {/* Stats Section with Gamification Display */}
                    {(userProfile?.xp > 0 || userProfile?.level) && (
                        <div className="mb-6 grid grid-cols-2 gap-3">
                            <div className="bg-zinc-800/40 rounded-lg p-3 text-center border border-zinc-700/30">
                                <div className="text-xs text-zinc-500 font-mono mb-1">Level</div>
                                <div className="text-xl font-bold text-purple-400 font-mono">{userProfile.level || 1}</div>
                            </div>
                            <div className="bg-zinc-800/40 rounded-lg p-3 text-center border border-zinc-700/30">
                                <div className="text-xs text-zinc-500 font-mono mb-1">XP</div>
                                <div className="text-xl font-bold text-blue-400 font-mono">{userProfile.xp || 0}</div>
                            </div>
                        </div>
                    )}

                    {/* Email */}
                    <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                        <p className="text-zinc-400 text-xs mb-1 font-mono">Email Address</p>
                        <p className="text-white text-sm font-mono">{user.email}</p>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-zinc-700 mb-4"></div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onEditProfile}
                            className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 py-2 px-4 rounded-lg transition-all duration-200 font-mono text-sm flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 py-2 px-4 rounded-lg transition-all duration-200 font-mono text-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main App Screen Component
const AppScreen = ({ user, onLogout, onDiscoveryMode, addToast, theme, toggleTheme }) => {
    const [currentView, setCurrentView] = useState('welcome');
    const [query, setQuery] = useState('');
    const [gameSteps, setGameSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [gameResponses, setGameResponses] = useState([]);
    const [currentScore, setCurrentScore] = useState(0);
    const [studentProfile, setStudentProfile] = useState({});
    const [generatedIdea, setGeneratedIdea] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [userHistory, setUserHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isLoadingRole, setIsLoadingRole] = useState(true);
    const [fullUserProfile, setFullUserProfile] = useState({});
    const [showProfileEditor, setShowProfileEditor] = useState(false);

    // User profile states
    const [showWelcome, setShowWelcome] = useState(true);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const functions = typeof firebase !== 'undefined' ? firebase.functions() : null;
    const firestore = typeof firebase !== 'undefined' ? firebase.firestore() : null;

    // Load user role function
    const loadUserRole = async () => {
        if (!functions) {
            setIsLoadingRole(false);
            return;
        }

        try {
            const getUserRole = functions.httpsCallable('getUserRole');
            const result = await getUserRole({ userId: user.uid });

            if (result.data.success) {
                setUserRole(result.data);
            }
        } catch (error) {
            console.error('Error loading user role:', error);
        } finally {
            setIsLoadingRole(false);
        }
    };

    // Load comprehensive user profile
    const loadUserProfile = async () => {
        if (!user || !firestore) return;

        try {
            const doc = await firestore.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                setFullUserProfile(data);
                // Also update student profile if exists
                if (data.lastProfile) setStudentProfile(data.lastProfile);
            }
        } catch (error) {
            console.error("Error loading user profile:", error);
        }
    };

    // Save profile changes
    const saveProfileChanges = async (updates) => {
        if (!user || !firestore) return;

        try {
            await firestore.collection('users').doc(user.uid).set(updates, { merge: true });

            // Update auth profile if name changed
            if (updates.displayName && updates.displayName !== user.displayName) {
                await user.updateProfile({ displayName: updates.displayName });
            }

            // Reload profile data
            await loadUserProfile();

            // Update local user object if name changed
            if (updates.displayName) {
                // This forces a refresh of the user object to reflect new display name
                const currentUser = firebase.auth().currentUser;
                // Force update
                const newUser = { ...user, displayName: updates.displayName };
                // Using a hacky way to force re-render if needed, or rely on auth state change
            }
        } catch (error) {
            console.error("Error saving profile changes:", error);
            throw error;
        }
    };

    // Load user history function
    const loadUserHistory = async () => {
        if (!functions) return;

        setIsLoadingHistory(true);
        try {
            const getUserHistory = functions.httpsCallable('getUserHistory');
            const result = await getUserHistory({ userId: user.uid });

            if (result.data.success) {
                setUserHistory(result.data.history);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Load history on component mount
    useEffect(() => {
        loadUserRole();
        loadUserHistory();
        loadUserProfile();

        // Set timer to hide welcome message after 4 seconds
        const welcomeTimer = setTimeout(() => {
            setShowWelcome(false);
        }, 4000);

        return () => clearTimeout(welcomeTimer);
    }, [user]);

    const startGameFlow = async () => {
        if (!functions) {
            alert('Firebase functions not available. Please run from Firebase hosting.');
            return;
        }

        try {
            const gameStepsGet = functions.httpsCallable('gameStepsGet');
            const result = await gameStepsGet({});

            if (result.data.success) {
                setGameSteps(result.data.steps);
                setCurrentView('game');
                setCurrentStepIndex(0);
                setGameResponses([]);
                setCurrentScore(0);
                setStudentProfile({});
            }
        } catch (error) {
            console.error('Error starting game flow:', error);
            alert('Error starting the gamified flow. Please try again.');
        }
    };

    const handleGameAnswer = (answer) => {
        const newResponses = [...gameResponses, answer];
        setGameResponses(newResponses);
        // Calculate new score locally to avoid state race condition
        const newScore = currentScore + answer.points;
        setCurrentScore(newScore);

        // Build student profile
        const newProfile = { ...studentProfile };
        if (answer.category === 'stream') newProfile.stream = answer.answer;
        else if (answer.category === 'year') newProfile.year = answer.answer;
        else if (answer.category === 'skillLevel') newProfile.skillLevel = answer.answer;
        else if (answer.category === 'teamSize') newProfile.teamSize = answer.answer;
        else if (answer.category === 'projectDuration') newProfile.projectDuration = answer.answer;
        else if (answer.category === 'interests') {
            newProfile.interests = newProfile.interests ? [...newProfile.interests, answer.answer] : [answer.answer];
        }
        else if (answer.category === 'preferredTechnologies') {
            newProfile.preferredTechnologies = newProfile.preferredTechnologies ? [...newProfile.preferredTechnologies, answer.answer] : [answer.answer];
        }

        setStudentProfile(newProfile);

        if (currentStepIndex < gameSteps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            // Game completed, now generate idea
            // Pass the newScore explicitly to avoid using stale state
            generatePersonalizedIdea(newProfile, newResponses, newScore);
        }
    };

    const generatePersonalizedIdea = async (profile, responses, finalScore = currentScore) => {
        if (!query.trim()) {
            alert('Please enter your project idea query first.');
            setCurrentView('welcome');
            return;
        }

        setCurrentView('generating');
        setIsGenerating(true);

        try {
            const generateIdea = functions.httpsCallable('generateIdea');
            const result = await generateIdea({
                query: query,
                studentProfile: profile,
                gameResponses: responses
            });

            if (result.data.success) {
                setGeneratedIdea(result.data.idea);
                setCurrentView('result');

                // Automatically save to history
                try {
                    console.log('Attempting to auto-save idea to history for user:', user.uid);
                    console.log('Idea data to save:', {
                        query: query,
                        ideaLength: result.data.idea ? result.data.idea.length : 0,
                        profileSummary: profile,
                        gameScore: finalScore,
                        gameStepsCount: responses.length
                    });

                    const saveIdeaToHistory = functions.httpsCallable('saveIdeaToHistory');
                    const saveResult = await saveIdeaToHistory({
                        userId: user.uid,
                        ideaData: {
                            query,
                            idea: result.data.idea,
                            studentProfile: profile,
                            gameScore: finalScore
                        },
                        gameSteps: responses
                    });

                    console.log('Idea automatically saved to history with result:', saveResult.data);

                    // Refresh history after saving
                    console.log('Refreshing history data...');
                    await loadUserHistory();
                    console.log('History refreshed, current count:', userHistory.length);
                } catch (historyError) {
                    console.error('Error auto-saving to history:', historyError);
                    // Don't show error to user as this is automatic
                }

                // Save to user profile
                if (firestore) {
                    await firestore.collection('users').doc(user.uid).set({
                        lastQuery: query,
                        lastProfile: profile,
                        lastScore: finalScore,
                        name: user.displayName,
                        email: user.email,
                    }, { merge: true });
                }
            }
        } catch (error) {
            console.error('Error generating personalized idea:', error);
            alert('Error generating your personalized idea. Please try again.');
            setCurrentView('welcome');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveToHistory = async () => {
        if (!functions) return;

        try {
            const saveIdeaToHistory = functions.httpsCallable('saveIdeaToHistory');
            await saveIdeaToHistory({
                userId: user.uid,
                ideaData: {
                    query,
                    idea: generatedIdea,
                    studentProfile,
                    gameScore: currentScore
                },
                gameSteps: gameResponses
            });
            alert('Project idea saved to your history!');
        } catch (error) {
            console.error('Error saving to history:', error);
            alert('Error saving to history. Please try again.');
        }
    };

    const startNewIdea = () => {
        setCurrentView('welcome');
        setQuery('');
        setGameResponses([]);
        setCurrentScore(0);
        setStudentProfile({});
        setGeneratedIdea('');
    };

    return (
        <div className={`${currentView === 'result' || currentView === 'admin' ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col bg-black relative`}>
            {/* Add particle system background */}
            <ParticleSystem />

            {/* Header */}
            {currentView !== 'result' && (
                <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800 p-4 relative z-10">
                    <div className="w-full px-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-white">Pideas</h1>
                            <span className="text-gray-400 hidden md:inline">|</span>
                            <span className="text-gray-300 hidden md:inline">Gamified Project Idea Generator</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                )}
                            </button>
                            <IconButton
                                iconType="history"
                                tooltip="History"
                                onClick={() => setCurrentView('history')}
                                variant="default"
                            />
                            {userRole?.isAdmin && (
                                <IconButton
                                    iconType="admin"
                                    tooltip="Admin Console"
                                    onClick={() => setCurrentView('admin')}
                                    variant="admin"
                                />
                            )}

                            {/* User profile section with animation */}
                            <div className="relative flex items-center">
                                {/* Animated welcome message */}
                                {showWelcome && (
                                    <span
                                        className={`text-gray-300 ${!showWelcome ? 'animate-fade-out' : 'animate-fade-in'}`}
                                        style={{ minWidth: '150px' }}
                                    >
                                        Welcome, {user.displayName}
                                    </span>
                                )}

                                {/* User profile icon (shows after welcome fades) */}
                                {!showWelcome && (
                                    <div className="animate-fade-in">
                                        <UserProfileIcon onClick={() => setShowProfileDropdown(!showProfileDropdown)} />
                                    </div>
                                )}

                                {/* User profile dropdown - positioned absolutely with high z-index */}
                                {showProfileDropdown && createPortal(
                                    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }}>
                                        <div className="absolute right-0 top-[60px] mr-4" style={{ pointerEvents: 'auto' }}>
                                            <UserProfileDropdown
                                                user={user}
                                                userProfile={fullUserProfile}
                                                userRole={userRole}
                                                onClose={() => setShowProfileDropdown(false)}
                                                onLogout={onLogout}
                                                onEditProfile={() => {
                                                    setShowProfileDropdown(false);
                                                    setShowProfileEditor(true);
                                                }}
                                            />
                                        </div>
                                    </div>,
                                    document.body
                                )}

                                {showProfileEditor && createPortal(
                                    <ProfileEditor
                                        user={user}
                                        currentProfile={fullUserProfile}
                                        onClose={() => setShowProfileEditor(false)}
                                        onSave={saveProfileChanges}
                                        isLoading={false}
                                    />,
                                    document.body
                                )}
                            </div>

                            <IconButton
                                iconType="logout"
                                tooltip="Logout"
                                onClick={onLogout}
                                variant="default"
                            />
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className={`flex-1 flex flex-col relative z-10 ${currentView === 'result' || currentView === 'admin'
                ? 'overflow-hidden' // Full screen views
                : 'items-center justify-center p-8' // Centered views (welcome, history)
                }`}>
                {currentView === 'welcome' && (
                    <div className="w-full max-w-4xl">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                                Smart Project Ideas for Students
                            </h2>
                            <p className="text-gray-400 text-lg mb-8">
                                Get personalized project ideas through our gamified context-gathering system
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Describe your project domain or interest (e.g., 'web development for e-commerce', 'AI for healthcare', 'mobile app for students')..."
                                    className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <button
                                onClick={startGameFlow}
                                disabled={!query.trim()}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                            >
                                🎮 Start Gamified Project Generation
                            </button>

                            <div className="text-center text-gray-400 text-sm flex flex-col gap-4">
                                <p>Answer 7 fun questions to get a perfectly tailored project idea!</p>

                                <div className="border-t border-gray-800/50 pt-4 mt-2">
                                    <p className="mb-3 text-gray-500">Or try our new advanced mode</p>
                                    <button
                                        onClick={onDiscoveryMode}
                                        className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors border border-purple-900/50 bg-purple-900/10 hover:bg-purple-900/20 px-4 py-2 rounded-full text-sm font-medium"
                                    >
                                        <span>🚀</span>
                                        <span>Enter Discovery Mode</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* History Section */}
                        <div className="mt-12">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-white">Your Recent Project Ideas</h3>
                                <span className="text-gray-400 text-sm">{userHistory.length} ideas generated</span>
                            </div>

                            {isLoadingHistory ? (
                                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
                                    <div className="text-gray-400">Loading your project history...</div>
                                </div>
                            ) : userHistory.length === 0 ? (
                                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
                                    <p className="text-gray-400">No project ideas generated yet. Start your first gamified session above!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {userHistory.slice(0, 6).map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setGeneratedIdea(item.idea);
                                                setCurrentView('result');
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-semibold text-white truncate">{item.query}</h4>
                                                <span className="text-green-400 font-medium text-sm ml-2">Score: {item.gameScore}</span>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2">
                                                {item.studentProfile.stream} • {item.studentProfile.skillLevel}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">
                                                {new Date(item.generatedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-blue-400">
                                                Click to view full idea →
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {userHistory.length > 6 && (
                                <div className="text-center mt-4">
                                    <button
                                        onClick={() => setCurrentView('history')}
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        View all {userHistory.length} ideas →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentView === 'game' && gameSteps.length > 0 && (
                    <GameStep
                        step={gameSteps[currentStepIndex]}
                        onAnswer={handleGameAnswer}
                        currentScore={currentScore}
                        totalSteps={gameSteps.length}
                    />
                )}

                {currentView === 'generating' && (
                    <div className="text-center">
                        <div className="mb-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <h3 className="text-2xl font-semibold text-white mb-2">Generating Your Perfect Project Idea</h3>
                            <p className="text-gray-400">Using your responses to create a personalized project...</p>
                            <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
                                <p className="text-green-400 font-medium">Final Score: {currentScore} points</p>
                                <p className="text-gray-300 text-sm mt-1">{studentProfile.stream} • {studentProfile.skillLevel}</p>
                            </div>
                        </div>
                    </div>
                )}

                {currentView === 'result' && generatedIdea && (
                    <ProjectIdeaDisplay
                        idea={generatedIdea}
                        onStartNew={startNewIdea}
                        user={user}
                        userProfile={fullUserProfile} // Pass profile for dropdown
                        onNavigate={setCurrentView}   // Pass navigation handler
                        onLogout={onLogout}           // Pass logout handler
                        onDiscoveryMode={onDiscoveryMode} // Pass discovery handler
                        theme={theme}
                    />
                )}

                {currentView === 'history' && (
                    <HistoryView
                        user={user}
                        onBack={() => setCurrentView('welcome')}
                        onViewIdea={(idea) => {
                            setGeneratedIdea(idea);
                            setCurrentView('result');
                        }}
                    />
                )}

                {currentView === 'admin' && (
                    <AdminConsole
                        user={user}
                        onBack={() => setCurrentView('welcome')}
                        theme={theme}
                    />
                )}
            </main>

            {/* Footer */}
            {currentView !== 'result' && currentView !== 'admin' && (
                <footer className="text-center py-6 text-gray-500 text-sm">
                    <p>Powered by <span className="text-white font-medium">AI & Gamification</span></p>
                    <div className="mt-2 space-x-4">
                        <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
                    </div>
                    <p className="mt-2">© 2024 Pideas. All rights reserved.</p>
                </footer>
            )}
        </div>
    );
};

// Main App Component
const App = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [firebaseError, setFirebaseError] = useState(null);

    // Discovery path states
    const [discoveryMode, setDiscoveryMode] = useState(false);
    const [discoveryStep, setDiscoveryStep] = useState('onboarding'); // 'onboarding', 'selection', 'generating'
    const [userProfile, setUserProfile] = useState(null);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [forceRender, setForceRender] = useState(0);
    const [toasts, setToasts] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    };

    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [theme]);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    useEffect(() => {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            setFirebaseError('Firebase SDK not loaded. Please ensure you are running this from Firebase hosting or have Firebase configured.');
            setIsInitializing(false);
            return;
        }

        try {
            const auth = firebase.auth();

            // Listen for authentication state changes
            const unsubscribe = auth.onAuthStateChanged((user) => {
                setUser(user);
                setIsInitializing(false);

                // Check if user logged in for discovery
                if (user && sessionStorage.getItem('startDiscoveryAfterLogin') === 'true') {
                    sessionStorage.removeItem('startDiscoveryAfterLogin');
                    // Start discovery mode after a brief delay to ensure UI is ready
                    setTimeout(() => {
                        setDiscoveryMode(true);
                        setDiscoveryStep('onboarding');
                    }, 500);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Firebase initialization error:', error);
            setFirebaseError('Firebase initialization failed: ' + error.message);
            setIsInitializing(false);
        }
    }, []);

    // All handler functions (no hooks) - must be before early returns
    const handleLogin = async () => {
        if (typeof firebase === 'undefined') {
            addToast('Firebase not available. Please run from Firebase hosting.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const auth = firebase.auth();
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Authentication error:', error);
            addToast('Login failed: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        if (typeof firebase === 'undefined') {
            return;
        }

        try {
            const auth = firebase.auth();
            await auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleDiscoveryPath = () => {
        setDiscoveryMode(true);
        setDiscoveryStep('onboarding');
    };

    const handleDiscoveryComplete = (profile) => {
        console.log('Discovery onboarding completed, profile:', profile);
        setUserProfile(profile);
        setDiscoveryStep('selection');
        // Force a re-render to ensure the UI updates
        setForceRender(prev => prev + 1);
    };

    const handleIdeaSelect = async (idea, profile) => {
        setSelectedIdea(idea);
        setDiscoveryStep('generating');

        try {
            // Generate full project documentation for the selected idea
            const prompt = `Generate a comprehensive project plan for: "${idea.title}"

            Based on comprehensive user profile:
            - Academic Stream: ${profile.stream || 'Computer Science'}
            - Academic Year: ${profile.year || '2nd-year'}
            - Technical Skill Level: ${profile.skillLevel || 'intermediate'}
            - Prior Experience: ${profile.priorExperience || 'classroom'}
            - Project Interests: ${Array.isArray(profile.interests) && profile.interests.length > 0 ? profile.interests.join(', ') : 'General programming'}
            - Preferred Technologies: ${Array.isArray(profile.preferredTechnologies) && profile.preferredTechnologies.length > 0 ? profile.preferredTechnologies.join(', ') : 'Open to any technology'}
            - Engineering Domain: ${profile.engineeringDomain || 'software'}
            - Desired Complexity: ${profile.projectComplexity || 'intermediate'}
            - Team Size Preference: ${profile.teamSize || 'small-team'}
            - Project Duration: ${profile.projectDuration || 'medium'}
            - Budget Range (INR): ${profile.budgetRange || 'no-budget'}
            - Learning Goals: ${Array.isArray(profile.learningGoals) && profile.learningGoals.length > 0 ? profile.learningGoals.join(', ') : 'Skill development'}
            - Industry Focus: ${profile.industryFocus || 'education'}

            Project Brief: ${idea.description}
            Technologies: ${idea.technologies}
            Learning Outcomes: ${idea.learning}

            Please provide a detailed project plan with:
            ## Project Title & Overview
            ## Learning Objectives
            ## Technical Requirements
            ## Implementation Phases
            ## Deliverables
            ## Resources & Tools
            ## Timeline & Milestones
            ## Evaluation Criteria

            Make it comprehensive and actionable for a ${profile.skillLevel} level student.`;

            const generateIdea = firebase.functions().httpsCallable('generateIdea');
            const result = await generateIdea({ prompt });

            if (result.data.success) {
                // Stay in discovery mode but move to result step
                setDiscoveryStep('result');

                // Store the generated comprehensive plan
                setSelectedIdea({
                    ...idea,
                    comprehensivePlan: result.data.idea
                });

                // Auto-save to history
                try {
                    const saveIdeaToHistory = firebase.functions().httpsCallable('saveIdeaToHistory');
                    console.log('Saving discovery idea to history:', {
                        userId: user.uid,
                        ideaData: {
                            query: prompt,
                            idea: result.data.idea,
                            studentProfile: profile,
                            gameScore: 0,
                            discoveryMode: true
                        },
                        gameSteps: []
                    });

                    await saveIdeaToHistory({
                        userId: user.uid,
                        ideaData: {
                            query: prompt,
                            idea: result.data.idea,
                            studentProfile: profile,
                            gameScore: 0,
                            discoveryMode: true
                        },
                        gameSteps: []
                    });
                    console.log('Successfully saved discovery idea to history');
                } catch (saveError) {
                    console.error('Error saving to history:', saveError);
                }
            } else {
                throw new Error(result.data.error || 'Failed to generate project plan');
            }
        } catch (error) {
            console.error('Error generating project plan:', error);
            addToast('Failed to generate project plan. Please try again.', 'error');
            setDiscoveryStep('selection');
        }
    };

    const handleBackToDiscovery = () => {
        setDiscoveryStep('onboarding');
        setUserProfile(null);
    };

    const handleExitDiscovery = () => {
        setDiscoveryMode(false);
        setDiscoveryStep('onboarding');
        setUserProfile(null);
        setSelectedIdea(null);
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (firebaseError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <ParticleSystem />
                <div className="content text-center z-10">
                    <div className="particle-text">Pideas</div>
                    <div className="mb-8">
                        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-wider">
                            Pideas
                        </h1>
                        <p className="text-gray-400 text-lg mb-4">
                            Project Idea Generator
                        </p>
                        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-red-300 text-sm">
                                {firebaseError}
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                                For full functionality, please deploy to Firebase hosting.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="bg-gray-900 min-h-screen">
            <ParticleSystem theme={theme} />
            {user ? (
                discoveryMode ? (
                    // Discovery Path Flow
                    <>
                        {discoveryStep === 'onboarding' && (
                            <DiscoveryOnboarding
                                key={`onboarding-${forceRender}`} // Add a key to force re-render when needed
                                onComplete={handleDiscoveryComplete}
                                user={user}
                            />
                        )}
                        {discoveryStep === 'selection' && (
                            <PersonalizedIdeaSelection
                                userProfile={userProfile}
                                onIdeaSelect={handleIdeaSelect}
                                onBackToDiscovery={handleBackToDiscovery}
                                user={user}
                            />
                        )}
                        {discoveryStep === 'generating' && (
                            <div className="min-h-screen bg-black flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-gray-700 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Generating Your Project Plan</h2>
                                    <p className="text-gray-400">Creating comprehensive documentation for: {selectedIdea?.title}</p>
                                </div>
                            </div>
                        )}
                        {discoveryStep === 'result' && (
                            <DiscoveryResult
                                idea={selectedIdea}
                                userProfile={userProfile}
                                onBackToSelection={() => setDiscoveryStep('selection')}
                                onExitDiscovery={handleExitDiscovery}
                                user={user}
                            />
                        )}
                    </>
                ) : <AppScreen
                    user={user}
                    onLogout={handleLogout}
                    onDiscoveryMode={handleDiscoveryPath}
                    addToast={addToast}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
            ) : (
                <LoginScreen
                    onLogin={handleLogin}
                    onDiscoveryPath={handleDiscoveryPath}
                    isLoading={isLoading}
                    addToast={addToast}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
            )}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
