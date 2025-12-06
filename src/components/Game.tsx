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
import { Bomber } from "./Bomber";
import { Paratrooper } from "./Paratrooper";
import { Bullet } from "./Bullet";
import { Bomb } from "./Bomb";
import { Explosion } from "./Explosion";
import { UI } from "./UI";
import { Bunker } from "./Bunker";

export function Game() {
  const { state, dispatch } = useGameState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const mousePositionRef = useRef({ x: GAME_WIDTH / 2, y: 0 });
  const [gameOverTime, setGameOverTime] = useState<number | null>(null);
  const [victoryTime, setVictoryTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [timeProgress, setTimeProgress] = useState(0);

  useGameLoop(
    state.gameStatus,
    state.wave,
    state.helicopters,
    state.helicoptersSpawnedThisWave,
    dispatch
  );

  // Track when game over happens
  useEffect(() => {
    if (state.gameStatus === "gameOver" && gameOverTime === null) {
      setGameOverTime(Date.now());
      setCountdown(3);
    } else if (state.gameStatus !== "gameOver") {
      setGameOverTime(null);
      setCountdown(3);
    }
  }, [state.gameStatus, gameOverTime]);

  // Track when victory happens
  useEffect(() => {
    if (state.gameStatus === "victory" && victoryTime === null) {
      setVictoryTime(Date.now());
      setCountdown(3);
    } else if (state.gameStatus !== "victory") {
      setVictoryTime(null);
    }
  }, [state.gameStatus, victoryTime]);

  // Track game start time and progress
  useEffect(() => {
    if (state.gameStatus === "playing" && gameStartTime === null) {
      setGameStartTime(Date.now());
      setTimeProgress(0);
    } else if (
      state.gameStatus !== "playing" &&
      state.gameStatus !== "destroying"
    ) {
      setGameStartTime(null);
      setTimeProgress(0);
    }
  }, [state.gameStatus, gameStartTime]);

  // Update time progress during gameplay
  useEffect(() => {
    if (
      (state.gameStatus === "playing" || state.gameStatus === "destroying") &&
      gameStartTime
    ) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - gameStartTime;
        const progress = Math.min((elapsed / (4 * 60 * 1000)) * 100, 100); // 4 minutes
        setTimeProgress(progress);

        // Trigger victory when time is up
        if (progress >= 100 && state.gameStatus === "playing") {
          dispatch({ type: "VICTORY" });
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [state.gameStatus, gameStartTime, dispatch]);

  // Update countdown during game over
  useEffect(() => {
    if (state.gameStatus === "gameOver" && gameOverTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - gameOverTime;
        const remaining = Math.ceil((3000 - elapsed) / 1000);
        setCountdown(Math.max(0, remaining));

        if (elapsed >= 3000) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [state.gameStatus, gameOverTime]);

  // Update countdown during victory
  useEffect(() => {
    if (state.gameStatus === "victory" && victoryTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - victoryTime;
        const remaining = Math.ceil((3000 - elapsed) / 1000);
        setCountdown(Math.max(0, remaining));

        if (elapsed >= 3000) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [state.gameStatus, victoryTime]);

  // Calculate scale to fit screen
  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / GAME_WIDTH;
      const scaleY = window.innerHeight / GAME_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
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

    // Determine which side we're on based purely on mouse X position
    const isRightSide = mouseX >= GUN_POSITION.x;

    // Calculate angle from the gun's rotation point (center of gunner)
    const gunnerHeight = 64;
    const gunRotationY = GUN_POSITION.y - gunnerHeight / 2;

    const dx = mouseX - GUN_POSITION.x;
    const dy = mouseY - gunRotationY;

    // Only allow shooting at or above horizontal (dy <= 0)
    const clampedDy = Math.min(dy, 0);
    const clampedMouseY = gunRotationY + clampedDy;

    // Store mouse position for bullet firing
    mousePositionRef.current = { x: mouseX, y: clampedMouseY };

    // Calculate angle: atan2(dy, dx) where right=0°, up=-90°, left=±180°
    // Use clampedDy so angle stays at horizontal when mouse is below
    const angleRad = Math.atan2(clampedDy, dx);
    const angleDeg = angleRad * (180 / Math.PI);

    // Convert to gun rotation (0-90 degrees from horizontal to up)
    let gunRotation;
    if (isRightSide) {
      // Right: 0° to -90° maps to 0-90 rotation
      gunRotation = Math.abs(angleDeg);
    } else {
      // Left: -180° to -90° maps to 0-90 rotation
      // When horizontal (angleDeg = ±180), gunRotation should be 0
      const absAngle = Math.abs(angleDeg);
      gunRotation = absAngle > 90 ? 180 - absAngle : absAngle;
    }

    // Positive angle = right side, negative = left side
    // Add a tiny offset to ensure flip happens correctly at horizontal
    let angle = isRightSide ? gunRotation : -gunRotation;
    if (gunRotation === 0) {
      angle = isRightSide ? 0.01 : -0.01;
    }

    dispatch({ type: "UPDATE_GUN_ANGLE", angle });
  };

  const handleClick = useCallback(() => {
    if (state.gameStatus === "menu") {
      dispatch({ type: "START_GAME" });
      return;
    }

    if (state.gameStatus === "gameOver") {
      // Only allow restart after 3 seconds
      if (gameOverTime && Date.now() - gameOverTime >= 3000) {
        dispatch({ type: "START_GAME" });
      }
      return;
    }

    if (state.gameStatus === "victory") {
      // Only allow restart after 3 seconds
      if (victoryTime && Date.now() - victoryTime >= 3000) {
        dispatch({ type: "START_GAME" });
      }
      return;
    }

    if (state.gameStatus !== "playing") return;

    // Bullet spawns at gun's rotation origin (center of gunner asset)
    // Gunner is positioned with its bottom at GUN_POSITION.y, so adjust for center
    const gunnerHeight = 64; // Height of gunner image (h-16 = 64px)
    const bulletSpawnPosition = {
      x: GUN_POSITION.x,
      y: GUN_POSITION.y - gunnerHeight / 2, // Move up half the gunner height
    };

    // Calculate direction from spawn position to mouse position
    const dx = mousePositionRef.current.x - bulletSpawnPosition.x;
    const dy = mousePositionRef.current.y - bulletSpawnPosition.y;

    // Clamp dy to only allow upward or horizontal shooting (dy <= 0)
    const clampedDy = Math.min(dy, 0);

    // Normalize and apply speed
    const length = Math.sqrt(dx * dx + clampedDy * clampedDy);
    const bulletSpeed = 400;

    const velocity = {
      x: (dx / length) * bulletSpeed,
      y: (clampedDy / length) * bulletSpeed,
    };

    dispatch({
      type: "FIRE_BULLET",
      position: bulletSpawnPosition,
      velocity,
      timestamp: Date.now(),
    });
  }, [state.gameStatus, dispatch, gameOverTime, victoryTime]);

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
    <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-purple-300 via-pink-200 to-orange-200">
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          background:
            "linear-gradient(to bottom, #c4b5fd 0%, #ddd6fe 30%, #f5d0fe 60%, #fce7f3 100%)",
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* Planetary Ring */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "15%",
            width: "1000px",
            height: "150px",
            transform: "translateX(-50%) rotateX(75deg)",
            background:
              "linear-gradient(to bottom, rgba(139, 92, 246, 0.25), rgba(168, 85, 247, 0.4), rgba(139, 92, 246, 0.25))",
            borderRadius: "50%",
            boxShadow: "0 0 60px rgba(168, 85, 247, 0.3)",
            pointerEvents: "none",
          }}
        />
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "15%",
            width: "700px",
            height: "100px",
            transform: "translateX(-50%) rotateX(75deg)",
            background: "#c4b5fd",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Ground */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-stone-700 via-stone-600 to-stone-500"
          style={{ height: `${GAME_HEIGHT - GROUND_Y}px` }}
        />

        {/* Menu Screen */}
        {state.gameStatus === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-yellow-300">
              <h1 className="text-6xl font-bold mb-4">HELLTROOPER</h1>
              <p className="text-2xl mb-8">Click to Start</p>
              <p className="text-lg">
                Click to fire • Destroy dropships and bots
              </p>
              <p className="text-lg">Don't let 4 bots land!</p>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {state.gameStatus === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-yellow-300">
              <h1 className="text-6xl font-bold mb-4">GAME OVER</h1>
              <p className="text-3xl mb-4">Final Score: {state.score}</p>
              <p className="text-2xl mb-8">Wave: {state.wave}</p>
              {countdown > 0 ? (
                <p className="text-xl text-gray-300">Wait {countdown}s...</p>
              ) : (
                <p className="text-xl animate-pulse">Click to Restart</p>
              )}
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {state.gameStatus === "victory" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-yellow-300">
              <h1 className="text-6xl font-bold mb-4">VICTORY!</h1>
              <p className="text-3xl mb-4">You survived!</p>
              <p className="text-3xl mb-4">Final Score: {state.score}</p>
              <p className="text-2xl mb-8">Wave: {state.wave}</p>
              {countdown > 0 ? (
                <p className="text-xl text-gray-300">Wait {countdown}s...</p>
              ) : (
                <p className="text-xl animate-pulse">Click to Restart</p>
              )}
            </div>
          </div>
        )}

        {/* UI */}
        {state.gameStatus === "playing" && (
          <>
            <UI
              score={state.score}
              wave={state.wave}
              landedTroopers={state.landedTroopers}
            />

            {/* Time Progress Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-80">
              <p className="text-yellow-300 text-center text-sm mb-2 font-bold">
                TIME TILL FREEDOM
              </p>
              <div className="w-full h-6 bg-gray-800 bg-opacity-70 rounded-full border-2 border-yellow-300">
                <div
                  className="h-full bg-linear-to-r from-yellow-400 to-yellow-200 rounded-full transition-all duration-100"
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Game Entities */}
        {(state.gameStatus === "playing" ||
          state.gameStatus === "destroying") && (
          <>
            {/* Bunker */}
            <Bunker x={GUN_POSITION.x} y={GROUND_Y} />

            {state.gameStatus === "playing" && (
              <Gunner
                angle={state.gunAngle}
                x={GUN_POSITION.x}
                y={GUN_POSITION.y}
                speechBubble={state.speechBubble}
              />
            )}

            {state.helicopters.map((heli) => (
              <Helicopter
                key={heli.id}
                x={heli.position.x}
                y={heli.position.y}
                direction={heli.direction}
              />
            ))}

            {state.bombers.map((bomber) => (
              <Bomber
                key={bomber.id}
                x={bomber.position.x}
                y={bomber.position.y}
                direction={bomber.direction}
              />
            ))}

            {state.bombs.map((bomb) => (
              <Bomb key={bomb.id} x={bomb.position.x} y={bomb.position.y} />
            ))}

            {state.paratroopers.map((para, index) => {
              // Calculate stacking position for troopers at bunker side
              const bunkerWidth = 64;
              const atBunkerSide =
                para.landed &&
                Math.abs(para.position.x - GUN_POSITION.x) <= bunkerWidth + 5;

              const troopersAtSameSide = state.paratroopers
                .slice(0, index)
                .filter((p) => {
                  if (!p.landed) return false;
                  const atSide =
                    Math.abs(p.position.x - GUN_POSITION.x) <= bunkerWidth + 5;
                  const sameSide =
                    Math.sign(p.position.x - GUN_POSITION.x) ===
                    Math.sign(para.position.x - GUN_POSITION.x);
                  return atSide && sameSide;
                }).length;

              const stackY = atBunkerSide
                ? GROUND_Y - troopersAtSameSide * 16
                : para.position.y;

              return (
                <Paratrooper
                  key={para.id}
                  x={para.position.x}
                  y={stackY}
                  parachuteOpen={para.parachuteOpen}
                  landed={para.landed}
                />
              );
            })}

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
