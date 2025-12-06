import gunnerImg from "../assets/gunner.png";
import gunImg from "../assets/gun.png";

interface GunnerProps {
  angle: number;
  x: number;
  y: number;
}

export function Gunner({ angle, x, y }: GunnerProps) {
  // Determine if we need to flip (when aiming to the right, angle > 90)
  const shouldFlip = angle > 90;

  // Adjust rotation angle for the gun
  // angle: 0=left(-90deg), 90=up(0deg), 180=right(90deg)
  // When flipped, we need to mirror the rotation
  const gunRotation = shouldFlip ? angle - 90 : angle - 90;

  return (
    <div
      className="absolute"
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
