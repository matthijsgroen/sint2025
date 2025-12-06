import gunnerImg from "../assets/gunner.png";
import gunImg from "../assets/gun.png";

interface GunnerProps {
  angle: number;
  x: number;
  y: number;
}

export function Gunner({ angle, x, y }: GunnerProps) {
  // angle: positive = right side, negative = left side
  // Gunner faces LEFT by default, flip when aiming RIGHT
  const shouldFlip = angle > 0;
  const gunRotation = Math.abs(angle);

  return (
    <div
      className="absolute z-10"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      {/* Container that flips both gun and gunner */}
      <div
        style={{
          transform: shouldFlip ? "scaleX(-1)" : "scaleX(1)",
        }}
      >
        {/* Gun (behind, rotating) */}
        <img
          src={gunImg}
          alt="Gun"
          className="absolute w-12 h-12"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotate(${gunRotation}deg)`,
            transformOrigin: "center center",
            zIndex: 0,
          }}
        />

        {/* Gunner turret (in front, static) */}
        <img
          src={gunnerImg}
          alt="Gunner"
          className="relative w-16 h-16"
          style={{
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}
