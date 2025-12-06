interface BunkerProps {
  x: number;
  y: number;
}

export function Bunker({ x, y }: BunkerProps) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      {/* Bunker structure */}
      <div className="relative">
        {/* Base - 3x bot height (16 * 3 = 48px) */}
        <div
          className="w-32 bg-stone-700 border-2 border-stone-900 rounded-t-lg"
          style={{ height: "48px" }}
        />
        {/* Top platform */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-2 bg-stone-600 border border-stone-900 rounded-t" />
      </div>
    </div>
  );
}
