import { useState} from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Paperclip, ArrowRight } from "lucide-react";
import { AuroraBackground } from "@/components/aurora-background";
import { motion } from "motion/react";

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const SUGGESTED_PROMPTS = [
  "A modern portfolio website with smooth animations",
  "An e-commerce store for handmade crafts",
  "A landing page for a SaaS product",
  "A blog with dark mode and responsive design",
  "A restaurant website with online menu",
  "A fitness tracker dashboard",
];

const NewScreen = () => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const handleStartBuilding = () => {
    if (input.trim()) {
      setIsTransitioning(true);
      const sessionId = generateUUID();
      
      // Navigate to create page with session_id and initial prompt
      setTimeout(() => {
        navigate(`/create?session_id=${sessionId}`, {
          state: {
            initialPrompt: input,
            session_id: sessionId,
          },
        });
      }, 800);
    }
  };

  const handlePromptClick = (prompt:string) => {
    setInput(prompt);
  };

  return (
    <AuroraBackground>
      {/* Transition Overlay */}
      {isTransitioning && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          style={{
            animation: "fadeIn 0.3s ease-out forwards",
          }}
        >
          <div style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
            <Sparkles className="w-16 h-16 text-white" />
          </div>
        </div>
      )}
      
      {/* Content */}
      <motion.div 
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative z-10 flex items-center justify-center min-h-screen p-8"
      >
        <div className="w-full max-w-2xl">
          {/* Logo and Title with Animation */}
          <div 
            className="text-center mb-12 space-y-4"
            style={{
              animation: "fadeSlideDown 0.8s ease-out",
            }}
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <Sparkles className="w-12 h-12 text-white" style={{ animation: "float 3s ease-in-out infinite" }} />
              <h1 className="text-6xl font-bold text-white">
                Beam
              </h1>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              What do you want to build?
            </h2>
            <p className="text-xl text-gray-400 font-light">
              Build stunning websites with Beam Sandboxes
            </p>
          </div>

          {/* Prompt Card with Enhanced Animation */}
          <div
            className="relative"
            style={{
              animation: "fadeSlideUp 0.8s ease-out 0.2s both",
            }}
          >
            <div
              className={`
                relative bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6
                shadow-2xl transition-all duration-300 border-2
                ${isFocused 
                  ? "border-white/40 shadow-white/20 scale-[1.02]" 
                  : "border-zinc-800 hover:border-zinc-700"
                }
              `}
            >
              {/* Glow effect when focused */}
              {isFocused && (
                <div
                  className="absolute inset-0 rounded-3xl bg-white opacity-5 blur-xl"
                  style={{ animation: "pulse 2s ease-in-out infinite" }}
                />
              )}

              <div className="relative">
                {/* Textarea Container */}
                <div className="relative">
                  <div className="absolute left-4 top-4 text-gray-500">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  
                  <Textarea
                    rows={4}
                    placeholder="Describe your dream website..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleStartBuilding();
                      }
                    }}
                    className="w-full pl-12 pr-4 py-4 text-lg resize-none border-0 focus:ring-0 bg-transparent text-white placeholder:text-gray-600"
                  />
                </div>

                {/* Action Button */}
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleStartBuilding}
                    disabled={!input.trim() || isTransitioning}
                    className="group bg-white hover:bg-gray-200 text-black px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:scale-105"
                  >
                    {isTransitioning ? "Starting..." : "Start Building"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div
            className="mt-8 space-y-3"
            style={{
              animation: "fadeIn 1s ease-out 0.4s both",
            }}
          >
            <p className="text-sm text-gray-500 text-center mb-4">Or try one of these:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left px-4 py-3 bg-zinc-900/60 backdrop-blur-md rounded-xl text-gray-300 text-sm font-medium border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 hover:text-white transition-all cursor-pointer"
                  style={{
                    animation: `fadeSlideUp 0.6s ease-out ${0.5 + i * 0.1}s both`,
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </AuroraBackground>
  );
};

export default NewScreen;