import gunnerImg from "../assets/gunner.png";

interface GunnerProps {
  angle: number;
  x: number;
  y: number;
}

export function Gunner({ angle, x, y }: GunnerProps) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <img
        src={gunnerImg}
        alt="Gunner"
        className="w-16 h-16"
        style={{
          transform: `rotate(${angle - 90}deg)`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
