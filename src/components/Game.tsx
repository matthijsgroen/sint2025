import { useCallback, useEffect, useRef } from "react";
import {
  useGameState,
  GUN_POSITION,
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
} from "../hooks/useGameState";
import { useGameLoop } from "../hooks/useGameLoop";
import { Gunner } from "./Gunner";
import { Helicopter } from "./Helicopter";
import { Paratrooper } from "./Paratrooper";
import { Bullet } from "./Bullet";
import { Explosion } from "./Explosion";
import { UI } from "./UI";

export function Game() {
  const { state, dispatch } = useGameState();
  const containerRef = useRef<HTMLDivElement>(null);

  useGameLoop(state.gameStatus, state.wave, state.helicopters, dispatch);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (state.gameStatus !== "playing") return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = mouseX - GUN_POSITION.x;
      const dy = mouseY - GUN_POSITION.y;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

      // Clamp angle to 0-180 (only shoot upward)
      angle = Math.max(0, Math.min(180, angle));

      dispatch({ type: "UPDATE_GUN_ANGLE", angle });
    },
    [state.gameStatus, dispatch]
  );

  const handleClick = useCallback(() => {
    if (state.gameStatus === "menu") {
      dispatch({ type: "START_GAME" });
      return;
    }

    if (state.gameStatus === "gameOver") {
      dispatch({ type: "START_GAME" });
      return;
    }

    if (state.gameStatus !== "playing") return;

    const angleRad = (state.gunAngle - 90) * (Math.PI / 180);
    const bulletSpeed = 400;

    const velocity = {
      x: Math.cos(angleRad) * bulletSpeed,
      y: Math.sin(angleRad) * bulletSpeed,
    };

    dispatch({
      type: "FIRE_BULLET",
      position: { ...GUN_POSITION },
      velocity,
      timestamp: Date.now(),
    });
  }, [state.gameStatus, state.gunAngle, dispatch]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleClick]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-sky-400 to-sky-200">
      <div
        ref={containerRef}
        className="relative bg-linear-to-b from-sky-300 to-green-200 cursor-crosshair"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* Ground */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-green-600"
          style={{ height: `${GAME_HEIGHT - GROUND_Y}px` }}
        />

        {/* Menu Screen */}
        {state.gameStatus === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4">PARATROOPER</h1>
              <p className="text-2xl mb-8">Click to Start</p>
              <p className="text-lg">
                Click to fire • Destroy helicopters and paratroopers
              </p>
              <p className="text-lg">Don't let 4 paratroopers land!</p>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {state.gameStatus === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4">GAME OVER</h1>
              <p className="text-3xl mb-4">Final Score: {state.score}</p>
              <p className="text-2xl mb-8">Wave: {state.wave}</p>
              <p className="text-xl">Click to Restart</p>
            </div>
          </div>
        )}

        {/* UI */}
        {state.gameStatus === "playing" && (
          <UI
            score={state.score}
            wave={state.wave}
            landedTroopers={state.landedTroopers}
          />
        )}

        {/* Game Entities */}
        {state.gameStatus === "playing" && (
          <>
            <Gunner
              angle={state.gunAngle}
              x={GUN_POSITION.x}
              y={GUN_POSITION.y}
            />

            {state.helicopters.map((heli) => (
              <Helicopter
                key={heli.id}
                x={heli.position.x}
                y={heli.position.y}
                direction={heli.direction}
              />
            ))}

            {state.paratroopers.map((para) => (
              <Paratrooper
                key={para.id}
                x={para.position.x}
                y={para.position.y}
                parachuteOpen={para.parachuteOpen}
                landed={para.landed}
              />
            ))}

            {state.bullets.map((bullet) => (
              <Bullet
                key={bullet.id}
                x={bullet.position.x}
                y={bullet.position.y}
              />
            ))}

            {state.explosions.map((explosion) => (
              <Explosion
                key={explosion.id}
                x={explosion.position.x}
                y={explosion.position.y}
                frame={explosion.frame}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
