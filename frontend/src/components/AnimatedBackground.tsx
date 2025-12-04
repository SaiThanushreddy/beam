import { Canvas } from "@react-three/fiber";
import MaroonDataSphere from "./MaroonDataSphere";

const AnimatedBackground = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    >
      <MaroonDataSphere />
    </Canvas>
  );
};

export default AnimatedBackground;