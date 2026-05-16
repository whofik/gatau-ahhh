import type { Spawn } from '../types';

interface SpawnItemProps {
  spawn: Spawn;
  size: number;
}

export function SpawnItem({ spawn, size }: SpawnItemProps) {
  return (
    <img
      src={spawn.image}
      alt="moving"
      className="spawn-img"
      style={{
        left: `${spawn.x}px`,
        top: `${spawn.y}px`,
        width: `${size}px`,
        transform: `rotate(${spawn.rotation}deg)`,
      }}
    />
  );
}
