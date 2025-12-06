interface BombProps {
  x: number;
  y: number;
}

export function Bomb({ x, y }: BombProps) {
  return (
    <div
      className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-red-800"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
