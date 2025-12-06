interface UIProps {
  score: number;
  wave: number;
  landedTroopers: number;
}

export function UI({ score, wave, landedTroopers }: UIProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between text-yellow-400 text-xl font-bold pointer-events-none">
      <div className="bg-black bg-opacity-50 px-4 py-2 rounded">
        Score: {score}
      </div>
      <div className="bg-black bg-opacity-50 px-4 py-2 rounded">
        Wave: {wave}
      </div>
      <div className="bg-black bg-opacity-50 px-4 py-2 rounded">
        Landed: {landedTroopers}
      </div>
    </div>
  );
}
