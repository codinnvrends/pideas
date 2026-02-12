import React from 'react';

interface TechStackSelectorProps {
    selectedTechs: string[];
    onChange: (techs: string[]) => void;
}

const COMMON_TECHS = [
    "React", "Vue.js", "Angular", "Svelte",
    "Node.js", "Python", "Django", "Flask",
    "Firebase", "Supabase", "MongoDB", "PostgreSQL",
    "TypeScript", "Rust", "Go", "Flutter", "React Native"
];

const TechStackSelector: React.FC<TechStackSelectorProps> = ({ selectedTechs, onChange }) => {

    const toggleTech = (tech: string) => {
        if (selectedTechs.includes(tech)) {
            onChange(selectedTechs.filter(t => t !== tech));
        } else {
            onChange([...selectedTechs, tech]);
        }
    };

    return (
        <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-3">
                Preferred Tech Stack (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
                {COMMON_TECHS.map(tech => (
                    <button
                        key={tech}
                        onClick={() => toggleTech(tech)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all border ${selectedTechs.includes(tech)
                                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                    >
                        {selectedTechs.includes(tech) && <span className="mr-1.5 text-xs">✓</span>}
                        {tech}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TechStackSelector;
