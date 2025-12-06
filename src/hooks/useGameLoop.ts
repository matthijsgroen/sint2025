import { useEffect, useRef } from "react";
import type { GameAction, Helicopter } from "../types/game";
import { GAME_WIDTH } from "./useGameState";

const BASE_SPAWN_INTERVAL = 5000; // ms - start slower
const MIN_SPAWN_INTERVAL = 1500; // ms - don't get too fast
const HELICOPTERS_PER_WAVE = 5; // Fixed number per wave

export function useGameLoop(
  gameStatus: "menu" | "playing" | "gameOver" | "destroying",
  wave: number,
  helicopters: Helicopter[],
  helicoptersSpawnedThisWave: number,
  dispatch: React.Dispatch<GameAction>
) {
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (gameStatus !== "playing") {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const gameLoop = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        lastSpawnRef.current = currentTime;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Update all entities
      dispatch({ type: "UPDATE_ENTITIES", deltaTime });

      // Spawn helicopters based on wave - limited number per wave
      const spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        BASE_SPAWN_INTERVAL - (wave - 1) * 150
      );

      if (
        currentTime - lastSpawnRef.current > spawnInterval &&
        helicoptersSpawnedThisWave < HELICOPTERS_PER_WAVE
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

      // Check for wave advancement - all helicopters spawned and cleared
      if (
        helicoptersSpawnedThisWave >= HELICOPTERS_PER_WAVE &&
        helicopters.length === 0
      ) {
        dispatch({ type: "NEXT_WAVE" });
        lastSpawnRef.current = currentTime;
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
