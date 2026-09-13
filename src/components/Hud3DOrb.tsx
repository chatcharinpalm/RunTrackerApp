import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { colors } from '../theme/theme';

/**
 * Decorative rotating "GPS lock" beacon — a real WebGL scene (three.js
 * rendered through expo-gl), not an image or Lottie file. Themed to match
 * what the app actually does: a location pin hovering over a pulsing
 * accuracy ring, orbited by two satellites. Failing to acquire a GL context
 * (rare, some web/older-device configurations) degrades to a plain glow
 * circle instead of crashing the screen.
 */
export function Hud3DOrb({ size = 96, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (failed) {
    return <View style={[{ width: size, height: size, borderRadius: size / 2 }, styles.fallback, style]} />;
  }

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = new THREE.WebGLRenderer({
        context: gl as unknown as WebGLRenderingContext,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
      camera.position.set(0, 0.3, 4.6);
      camera.lookAt(0, 0.1, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const point = new THREE.PointLight(0x00ff66, 2.4, 20);
      point.position.set(2, 3, 3);
      scene.add(point);

      // --- Location pin (sphere head + cone tip — a surface of revolution, so it spins cleanly) ---
      const pin = new THREE.Group();
      const pinHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 0.85, roughness: 0.3 })
      );
      pinHead.position.y = 0.55;
      const pinTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.75, 24),
        new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 0.6, roughness: 0.4 })
      );
      pinTip.position.y = -0.15;
      pinTip.rotation.x = Math.PI;
      pin.add(pinHead, pinTip);
      scene.add(pin);

      // --- Pulsing ground accuracy ring ---
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.3, 1.5, 48),
        new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -1.1;
      scene.add(ring);

      // --- Orbiting satellites ---
      const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
      const orbitA = new THREE.Group();
      orbitA.rotation.x = 0.5;
      const satA = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), satelliteMaterial);
      satA.position.set(2.1, 0, 0);
      orbitA.add(satA);
      scene.add(orbitA);

      const orbitB = new THREE.Group();
      orbitB.rotation.x = -0.35;
      orbitB.rotation.z = 0.6;
      const satB = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff5500 })
      );
      satB.position.set(1.75, 0, 0);
      orbitB.add(satB);
      scene.add(orbitB);

      let time = 0;
      const render = () => {
        if (!mountedRef.current) return;
        frameRef.current = requestAnimationFrame(render);
        time += 0.016;

        pin.rotation.y += 0.012;
        orbitA.rotation.y += 0.02;
        orbitB.rotation.y -= 0.015;

        const pulse = 1 + Math.sin(time * 2) * 0.08;
        ring.scale.set(pulse, pulse, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 2) * 0.2;

        pin.position.y = Math.sin(time * 1.5) * 0.08;

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      render();
    } catch (e) {
      console.warn('[Hud3DOrb] WebGL context failed, falling back to static glow:', e);
      setFailed(true);
    }
  };

  return <GLView style={[{ width: size, height: size }, style]} onContextCreate={onContextCreate} />;
}

const styles = {
  fallback: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
} as const;
