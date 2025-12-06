import { useCallback, useEffect, useRef, useState } from "react";
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
  const [scale, setScale] = useState(1);
  const mousePositionRef = useRef({ x: GAME_WIDTH / 2, y: 0 });

  useGameLoop(state.gameStatus, state.wave, state.helicopters, dispatch);

  // Calculate scale to fit screen
  useEffect(() => {
    const updateScale = () => {
      const padding = 40; // Padding around the game
      const scaleX = (window.innerWidth - padding) / GAME_WIDTH;
      const scaleY = (window.innerHeight - padding) / GAME_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x to avoid too large
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state.gameStatus !== "playing") return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Account for scale when calculating mouse position
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    // Store mouse position for bullet firing
    mousePositionRef.current = { x: mouseX, y: mouseY };

    const dx = mouseX - GUN_POSITION.x;
    const dy = mouseY - GUN_POSITION.y;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Clamp angle to -90 to 90 (left to right, with 0 being straight up)
    angle = Math.max(-90, Math.min(90, angle));

    // Convert to 0-180 range where 0=left, 90=up, 180=right
    angle = angle + 90;

    dispatch({ type: "UPDATE_GUN_ANGLE", angle });
  };

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

    // Calculate direction from gun to mouse position
    const dx = mousePositionRef.current.x - GUN_POSITION.x;
    const dy = mousePositionRef.current.y - GUN_POSITION.y;

    // Normalize and apply speed
    const length = Math.sqrt(dx * dx + dy * dy);
    const bulletSpeed = 400;

    const velocity = {
      x: (dx / length) * bulletSpeed,
      y: (dy / length) * bulletSpeed,
    };

    dispatch({
      type: "FIRE_BULLET",
      position: { ...GUN_POSITION },
      velocity,
      timestamp: Date.now(),
    });
  }, [state.gameStatus, dispatch]);

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
          transform: `scale(${scale})`,
          transformOrigin: "center center",
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
