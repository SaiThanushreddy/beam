import AnimatedBackground from "./components/AnimatedBackground";
import "./App.css";

import { Route, Routes } from "react-router-dom";

import CreateRoute from "./screens/Create";
import NewScreen from "./screens/New";

const App: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white text-gray-900">
      <AnimatedBackground />
      <div className="w-full h-full flex flex-col items-center justify-start">
        <Routes>
          <Route path="/" element={<NewScreen />} />
          <Route path="/create" element={<CreateRoute />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
