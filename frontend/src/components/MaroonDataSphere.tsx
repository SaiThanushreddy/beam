import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const MaroonDataSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const solidMeshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Sphere geometry
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, 1), []);

  // Particles
  const particleCount = 1000;
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 5; // Adjust particle spread
    }
    return arr;
  }, []);

  // Animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
    if (solidMeshRef.current) {
      solidMeshRef.current.rotation.x += 0.001;
      solidMeshRef.current.rotation.y += 0.002;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.x += 0.0005;
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <>
      {/* Main Layer: Wireframe */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial color="#881337" transparent opacity={0.2} wireframe />
      </mesh>

      {/* Secondary Layer: Solid, transparent mesh */}
      <mesh ref={solidMeshRef} geometry={geometry} scale={[0.9, 0.9, 0.9]}>
        <meshBasicMaterial color="#881337" transparent opacity={0.1} />
      </mesh>

      {/* Sparkle System */}
      <Points ref={particlesRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#881337"
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </>
  );
};

export default MaroonDataSphere;