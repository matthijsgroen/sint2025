import shipImg from "../assets/ship.webp";

interface HelicopterProps {
  x: number;
  y: number;
  direction: "left" | "right";
}

export function Helicopter({ x, y, direction }: HelicopterProps) {
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
      <img src={shipImg} alt="Helicopter" className="w-20 h-12" />
    </div>
  );
}
