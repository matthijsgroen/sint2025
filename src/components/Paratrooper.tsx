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
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="w-6 h-3 bg-white border border-gray-800 rounded-t-full"></div>
          <div className="flex justify-between px-0.5">
            <div className="w-px h-2 bg-gray-800 origin-top -rotate-45"></div>
            <div className="w-px h-2 bg-gray-800 origin-top rotate-45"></div>
          </div>
        </div>
      )}
      <img
        src={botImg}
        alt="Paratrooper"
        className="w-8 h-8"
        draggable={false}
      />
    </div>
  );
}
