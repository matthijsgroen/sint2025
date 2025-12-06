interface BulletProps {
  x: number;
  y: number;
}

export function Bullet({ x, y }: BulletProps) {
  return (
    <div
      className="absolute w-2 h-2 bg-yellow-400 rounded-full border border-orange-500"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
