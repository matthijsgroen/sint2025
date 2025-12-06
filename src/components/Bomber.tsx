import gunshipImg from "../assets/gunship.webp";

interface BomberProps {
  x: number;
  y: number;
  direction: "left" | "right";
}

export function Bomber({ x, y, direction }: BomberProps) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) scaleX(${
          direction === "left" ? -1 : 1
        })`,
      }}
    >
      <img
        src={gunshipImg}
        alt="Bomber"
        className="w-24 h-16"
        draggable={false}
      />
    </div>
  );
}
