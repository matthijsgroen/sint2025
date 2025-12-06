import { useEffect, useRef } from "react";
import type { GameAction, Helicopter } from "../types/game";
import { GAME_WIDTH } from "./useGameState";

const BASE_SPAWN_INTERVAL = 3000; // ms
const MIN_SPAWN_INTERVAL = 1000; // ms

export function useGameLoop(
  gameStatus: "menu" | "playing" | "gameOver",
  wave: number,
  helicopters: Helicopter[],
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

      // Spawn helicopters based on wave
      const spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        BASE_SPAWN_INTERVAL - (wave - 1) * 200
      );

      if (currentTime - lastSpawnRef.current > spawnInterval) {
        const direction = Math.random() > 0.5 ? "right" : "left";
        const helicopter: Helicopter = {
          id: `heli-${Date.now()}-${Math.random()}`,
          position: {
            x: direction === "right" ? -50 : GAME_WIDTH + 50,
            y: 50 + Math.random() * 100,
          },
          direction,
          speed: 100 + wave * 10,
          dropCooldown: 1000 + Math.random() * 2000,
          health: 1,
        };

        dispatch({ type: "SPAWN_HELICOPTER", helicopter });
        lastSpawnRef.current = currentTime;
      }

      // Check for wave advancement (all helicopters cleared)
      if (
        helicopters.length === 0 &&
        currentTime - lastSpawnRef.current > spawnInterval * 2
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
  }, [gameStatus, wave, helicopters.length, dispatch]);
}
