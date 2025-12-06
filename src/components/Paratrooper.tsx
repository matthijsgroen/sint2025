import botImg from "../assets/bot.png";

interface ParatrooperProps {
  x: number;
  y: number;
  parachuteOpen: boolean;
  landed: boolean;
}

export function Paratrooper({ x, y, parachuteOpen, landed }: ParatrooperProps) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {parachuteOpen && !landed && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="w-12 h-6 bg-white border-2 border-gray-800 rounded-t-full"></div>
          <div className="flex justify-between px-1">
            <div className="w-0.5 h-4 bg-gray-800"></div>
            <div className="w-0.5 h-4 bg-gray-800"></div>
          </div>
        </div>
      )}
      <img src={botImg} alt="Paratrooper" className="w-8 h-8" />
    </div>
  );
}
