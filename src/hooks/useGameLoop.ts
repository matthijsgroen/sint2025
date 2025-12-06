import { useEffect, useRef } from "react";
import type { GameAction, Helicopter, Bomber } from "../types/game";
import { GAME_WIDTH } from "./useGameState";

const BASE_SPAWN_INTERVAL = 5000; // ms - start slower
const MIN_SPAWN_INTERVAL = 1000; // ms - don't get too fast
const BASE_HELICOPTERS = 4; // Starting number of helicopters in wave 1
const MIN_BOMBER_SPAWN_INTERVAL = 30000; // 30 seconds minimum
const MAX_BOMBER_SPAWN_INTERVAL = 60000; // 60 seconds maximum
const BOMBER_SPEED = 200; // pixels/second - fast!

export function useGameLoop(
  gameStatus: "menu" | "playing" | "gameOver" | "destroying" | "victory",
  wave: number,
  helicopters: Helicopter[],
  helicoptersSpawnedThisWave: number,
  dispatch: React.Dispatch<GameAction>
) {
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const lastBomberSpawnRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (gameStatus !== "playing" && gameStatus !== "destroying") {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const gameLoop = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        lastSpawnRef.current = currentTime;
        lastBomberSpawnRef.current = currentTime;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Update all entities
      dispatch({ type: "UPDATE_ENTITIES", deltaTime });

      // Only spawn and advance waves when playing (not during destroying state)
      if (gameStatus === "playing") {
        // Calculate helicopters for this wave: wave 1 = 4, wave 2 = 5, etc.
        const helicoptersThisWave = BASE_HELICOPTERS + (wave - 1);

        // Spawn helicopters based on wave - limited number per wave
        const spawnInterval = Math.max(
          MIN_SPAWN_INTERVAL,
          BASE_SPAWN_INTERVAL - (wave - 1) * 200
        );

        if (
          currentTime - lastSpawnRef.current > spawnInterval &&
          helicoptersSpawnedThisWave < helicoptersThisWave
        ) {
          const direction = Math.random() > 0.5 ? "right" : "left";
          const helicopter: Helicopter = {
            id: `heli-${Date.now()}-${Math.random()}`,
            position: {
              x: direction === "right" ? -50 : GAME_WIDTH + 50,
              y: 50 + Math.random() * 100,
            },
            direction,
            speed: 80 + wave * 6,
            dropCooldown: 1000 + Math.random() * 2000,
            health: 1,
          };

          dispatch({ type: "SPAWN_HELICOPTER", helicopter });
          lastSpawnRef.current = currentTime;
        }

        // Spawn bombers at random intervals - gets slightly more frequent with waves
        const waveReduction = Math.min((wave - 1) * 1000, 5000); // Max 5s reduction
        const minInterval = Math.max(
          10000,
          MIN_BOMBER_SPAWN_INTERVAL - waveReduction
        );
        const maxInterval = Math.max(
          minInterval + 10000,
          MAX_BOMBER_SPAWN_INTERVAL - waveReduction
        );
        const randomBomberInterval =
          minInterval + Math.random() * (maxInterval - minInterval);

        if (currentTime - lastBomberSpawnRef.current > randomBomberInterval) {
          const direction = Math.random() > 0.5 ? "right" : "left";
          const bomber: Bomber = {
            id: `bomber-${Date.now()}-${Math.random()}`,
            position: {
              x: direction === "right" ? -50 : GAME_WIDTH + 50,
              y: 30 + Math.random() * 40, // Higher than helicopters
            },
            direction,
            speed: BOMBER_SPEED,
            hasBombed: false,
          };

          dispatch({ type: "SPAWN_BOMBER", bomber, timestamp: currentTime });
          lastBomberSpawnRef.current = currentTime;
        }

        // Check for wave advancement - all helicopters spawned and cleared
        if (
          helicoptersSpawnedThisWave >= helicoptersThisWave &&
          helicopters.length === 0
        ) {
          dispatch({ type: "NEXT_WAVE" });
          lastSpawnRef.current = currentTime;
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameStatus,
    wave,
    helicopters.length,
    helicoptersSpawnedThisWave,
    dispatch,
  ]);
}
