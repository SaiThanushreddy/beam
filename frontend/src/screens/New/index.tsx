import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import AnimatedBackground from "@/components/AnimatedBackground";
import Header from "@/components/NewHeader";
import Footer from "@/components/NewFooter";
import MaroonDataSphere from "@/components/MaroonDataSphere";

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const NewScreen = () => {
  const [input, setInput] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const handleStartBuilding = () => {
    if (input.trim()) {
      setIsTransitioning(true);
      const sessionId = generateUUID();
      
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      <Header />
      <AnimatedBackground />
      
      {/* Three.js Canvas for the Data Sphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <MaroonDataSphere />
        </Canvas>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4 leading-tight">
          Create with Beam
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
          Describe your vision, and watch our AI bring it to life in a fully functional sandbox environment. Go from idea to reality in minutes.
        </p>

        {/* Prompt Card */}
        <div className="w-full max-w-2xl">
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-4 flex items-center gap-4">
            <Textarea
              rows={1}
              placeholder="e.g., A sleek, modern portfolio for a photographer"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleStartBuilding();
                }
              }}
              className="w-full text-md resize-none border-0 focus:ring-0 bg-transparent text-gray-900 placeholder:text-gray-500"
            />
            <Button
              onClick={handleStartBuilding}
              disabled={!input.trim() || isTransitioning}
              className="group bg-rose-900 hover:bg-rose-700 text-white px-6 py-4 rounded-xl text-lg font-semibold shadow-md transition-all duration-300 disabled:opacity-50"
            >
              <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NewScreen;