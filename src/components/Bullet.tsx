import gunImg from "../assets/gun.png";

interface BulletProps {
  x: number;
  y: number;
}

export function Bullet({ x, y }: BulletProps) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <img src={gunImg} alt="Bullet" className="w-3 h-3" />
    </div>
  );
}
