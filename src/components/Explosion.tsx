interface ExplosionProps {
  x: number;
  y: number;
  frame: number;
}

export function Explosion({ x, y, frame }: ExplosionProps) {
  const size = 20 + frame * 4;
  const opacity = 1 - frame / 10;

  return (
    <div
      className="absolute rounded-full bg-orange-500 animate-pulse"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: "translate(-50%, -50%)",
        opacity,
      }}
    >
      <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-70"></div>
    </div>
  );
}
