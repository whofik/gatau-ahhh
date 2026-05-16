import { useState, useEffect, useCallback, useRef } from 'react';
import { assets, appSettings } from './settings';
import { SpawnItem } from './components/SpawnItem';
import type { Spawn } from './types';
import './App.css';

const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
const audioCtx = new AudioContextClass();

function App() {
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const nextIdRef = useRef(0);
  const spawnsRef = useRef<Spawn[]>([]);

  useEffect(() => {
    spawnsRef.current = spawns;
  }, [spawns]);

  const handleClick = (e: React.MouseEvent) => {
    if (spawnsRef.current.length >= appSettings.maxSpawns) return;

    const currentId = nextIdRef.current;
    nextIdRef.current += 1;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const activeImageUrls = spawnsRef.current.map(s => s.image);
    const availableAssets = assets.filter(a => !activeImageUrls.includes(a.img));
    const asset = availableAssets.length > 0 
      ? availableAssets[Math.floor(Math.random() * availableAssets.length)]
      : assets[Math.floor(Math.random() * assets.length)];

    const audio = new Audio(asset.sound);
    audio.loop = false;
    audio.crossOrigin = "anonymous";
    
    const source = audioCtx.createMediaElementSource(audio);
    const gainNode = audioCtx.createGain();
    
    gainNode.gain.value = appSettings.volumeBoost; 
    
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audio.play().catch(err => console.error("Audio play failed:", err));

    const imgSize = Math.min(window.innerWidth * 0.25, 180);
    
    const newSpawn: Spawn = {
      id: currentId,
      x: e.clientX - imgSize / 2,
      y: e.clientY - imgSize / 2,
      vx: (Math.random() - 0.5) * (15 + Math.random() * 15),
      vy: (Math.random() - 0.5) * (15 + Math.random() * 15),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * (20 + Math.random() * 40),
      image: asset.img
    };

    setSpawns(prev => [...prev, newSpawn]);

    audio.onended = () => {
      setSpawns(prev => prev.filter(s => s.id !== currentId));
    };
    
    setTimeout(() => {
      setSpawns(prev => prev.filter(s => s.id !== currentId));
    }, appSettings.fallbackTimeoutMs);
  };

  const updatePositions = useCallback(() => {
    if (spawnsRef.current.length === 0) return;

    const imgSize = Math.min(window.innerWidth * 0.25, 180);
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    setSpawns(prevSpawns => {
      let nextSpawns = prevSpawns.map(spawn => {
        let { x, y, vx, vy, rotation, rotationSpeed } = spawn;

        x += vx;
        y += vy;
        rotation += rotationSpeed;

        if (x <= 0) {
          vx = Math.abs(vx);
          x = 0;
        } else if (x >= winW - imgSize) {
          vx = -Math.abs(vx);
          x = winW - imgSize;
        }

        if (y <= 0) {
          vy = Math.abs(vy);
          y = 0;
        } else if (y >= winH - imgSize) {
          vy = -Math.abs(vy);
          y = winH - imgSize;
        }

        return { ...spawn, x, y, vx, vy, rotation };
      });

      for (let i = 0; i < nextSpawns.length; i++) {
        for (let j = i + 1; j < nextSpawns.length; j++) {
          let s1 = nextSpawns[i];
          let s2 = nextSpawns[j];

          let cx1 = s1.x + imgSize / 2;
          let cy1 = s1.y + imgSize / 2;
          let cx2 = s2.x + imgSize / 2;
          let cy2 = s2.y + imgSize / 2;

          let dx = cx2 - cx1;
          let dy = cy2 - cy1;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let minDist = imgSize;

          if (distance < minDist && distance > 0) {
            let nx = dx / distance;
            let ny = dy / distance;

            let overlap = minDist - distance;
            s1.x -= nx * (overlap / 2);
            s1.y -= ny * (overlap / 2);
            s2.x += nx * (overlap / 2);
            s2.y += ny * (overlap / 2);

            let dvx = s2.vx - s1.vx;
            let dvy = s2.vy - s1.vy;
            let velAlongNormal = dvx * nx + dvy * ny;

            if (velAlongNormal < 0) {
              let impulse = -(1 + 1) * velAlongNormal / 2;
              let impulseX = nx * impulse;
              let impulseY = ny * impulse;

              s1.vx -= impulseX;
              s1.vy -= impulseY;
              s2.vx += impulseX;
              s2.vy += impulseY;
            }
          }
        }
      }

      return nextSpawns;
    });
  }, []);

  useEffect(() => {
    let requestRef: number;
    
    const animate = () => {
      updatePositions();
      requestRef = requestAnimationFrame(animate);
    };

    requestRef = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef);
  }, [updatePositions]);

  const imgSize = Math.min(window.innerWidth * 0.25, 180);

  return (
    <div className="app-container" onClick={handleClick} tabIndex={-1}>
      <div className="title-container">
        <h1 className="title">Gatauu ahh</h1>
        <p className="subtitle">Click di mana ajaa</p>
      </div>
      {spawns.map(spawn => (
        <SpawnItem key={spawn.id} spawn={spawn} size={imgSize} />
      ))}
    </div>
  );
}

export default App;
