import { useReducer } from "react";
import type {
  GameState,
  GameAction,
  Paratrooper,
  Bullet,
  Explosion,
  Bomb,
} from "../types/game";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GROUND_Y = GAME_HEIGHT - 100;
const BUNKER_HEIGHT = 48; // 3x bot height (16px)
const GUN_POSITION = { x: GAME_WIDTH / 2, y: GROUND_Y - BUNKER_HEIGHT };
const FIRE_COOLDOWN = 200; // ms
const MAX_LANDED_TROOPERS = 4;
const PARACHUTE_OPEN_HEIGHT = 200;
const GRAVITY = 150; // pixels/second²
const BOMB_DROP_DISTANCE = 250; // pixels from bunker
const BUNKER_RADIUS = 66; // Half of bunker width

const initialState: GameState = {
  score: 0,
  wave: 1,
  landedTroopers: 0,
  helicoptersSpawnedThisWave: 0,
  gameStatus: "menu",
  helicopters: [],
  bombers: [],
  bombs: [],
  paratroopers: [],
  bullets: [],
  explosions: [],
  gunAngle: 90,
  lastFireTime: 0,
  destroyingStartTime: 0,
  lastBomberSpawn: 0,
};

function checkCollision(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  radius1: number,
  radius2: number
): boolean {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius1 + radius2;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...initialState,
        gameStatus: "playing",
        helicoptersSpawnedThisWave: 0,
      };

    case "GAME_OVER":
      return {
        ...state,
        gameStatus: "gameOver",
      };

    case "SET_DESTROYING":
      return {
        ...state,
        gameStatus: "destroying",
        destroyingStartTime: action.timestamp,
      };

    case "UPDATE_GUN_ANGLE":
      return {
        ...state,
        gunAngle: action.angle,
      };

    case "FIRE_BULLET": {
      if (action.timestamp - state.lastFireTime < FIRE_COOLDOWN) {
        return state;
      }

      const newBullet: Bullet = {
        id: `bullet-${Date.now()}-${Math.random()}`,
        position: { ...action.position },
        velocity: { ...action.velocity },
        active: true,
      };

      return {
        ...state,
        bullets: [...state.bullets, newBullet],
        lastFireTime: action.timestamp,
      };
    }

    case "SPAWN_HELICOPTER":
      return {
        ...state,
        helicopters: [...state.helicopters, action.helicopter],
        helicoptersSpawnedThisWave: state.helicoptersSpawnedThisWave + 1,
      };

    case "SPAWN_BOMBER":
      return {
        ...state,
        bombers: [...state.bombers, action.bomber],
        lastBomberSpawn: action.timestamp,
      };

    case "ADD_EXPLOSION": {
      const newExplosion: Explosion = {
        id: `explosion-${Date.now()}-${Math.random()}`,
        position: { ...action.position },
        frame: 0,
      };

      return {
        ...state,
        explosions: [...state.explosions, newExplosion],
      };
    }

    case "NEXT_WAVE": {
      return {
        ...state,
        wave: state.wave + 1,
        helicoptersSpawnedThisWave: 0,
      };
    }

    case "UPDATE_ENTITIES": {
      const { deltaTime } = action;
      const dt = deltaTime / 1000; // Convert to seconds

      // Update helicopters
      let helicopters = state.helicopters.map((heli) => ({
        ...heli,
        position: {
          x:
            heli.position.x +
            heli.speed * (heli.direction === "right" ? 1 : -1) * dt,
          y: heli.position.y,
        },
        dropCooldown: heli.dropCooldown - deltaTime,
      }));

      // Remove helicopters that flew off screen
      helicopters = helicopters.filter(
        (heli) => heli.position.x > -50 && heli.position.x < GAME_WIDTH + 50
      );

      // Update bombers
      let bombers = state.bombers.map((bomber) => ({
        ...bomber,
        position: {
          x:
            bomber.position.x +
            bomber.speed * (bomber.direction === "right" ? 1 : -1) * dt,
          y: bomber.position.y,
        },
      }));

      // Remove bombers that flew off screen
      bombers = bombers.filter(
        (bomber) =>
          bomber.position.x > -50 && bomber.position.x < GAME_WIDTH + 50
      );

      // Drop bombs from bombers
      const newBombs: Bomb[] = [];
      bombers = bombers.map((bomber) => {
        if (!bomber.hasBombed) {
          const distanceFromBunker = Math.abs(
            bomber.position.x - GUN_POSITION.x
          );
          if (distanceFromBunker <= BOMB_DROP_DISTANCE) {
            // Calculate arc trajectory toward bunker
            const dx = GUN_POSITION.x - bomber.position.x;
            const dy = GUN_POSITION.y - bomber.position.y;
            const timeToTarget = 2.5; // seconds

            const vx = dx / timeToTarget;
            const vy = dy / timeToTarget - 0.5 * GRAVITY * timeToTarget;

            newBombs.push({
              id: `bomb-${Date.now()}-${Math.random()}`,
              position: { x: bomber.position.x, y: bomber.position.y + 10 },
              velocity: { x: vx, y: vy },
              active: true,
            });
            return { ...bomber, hasBombed: true };
          }
        }
        return bomber;
      });

      // Update bombs with gravity
      let bombs = [...state.bombs, ...newBombs].map((bomb) => ({
        ...bomb,
        position: {
          x: bomb.position.x + bomb.velocity.x * dt,
          y: bomb.position.y + bomb.velocity.y * dt,
        },
        velocity: {
          x: bomb.velocity.x,
          y: bomb.velocity.y + GRAVITY * dt,
        },
      }));

      // Remove bombs that hit the ground or went off screen
      bombs = bombs.filter(
        (bomb) =>
          bomb.position.y < GROUND_Y + 20 &&
          bomb.position.x > -50 &&
          bomb.position.x < GAME_WIDTH + 50
      );

      // Drop paratroopers from helicopters
      const newParatroopers: Paratrooper[] = [];
      helicopters = helicopters.map((heli) => {
        if (heli.dropCooldown <= 0) {
          // Only drop if helicopter is within screen bounds (with margin)
          if (heli.position.x > 50 && heli.position.x < GAME_WIDTH - 50) {
            newParatroopers.push({
              id: `para-${Date.now()}-${Math.random()}`,
              position: { x: heli.position.x, y: heli.position.y + 20 },
              velocity: { x: 0, y: 20 },
              parachuteOpen: false,
              landed: false,
            });
          }
          return { ...heli, dropCooldown: 2000 + Math.random() * 1000 };
        }
        return heli;
      });

      // Update paratroopers
      let paratroopers = [...state.paratroopers, ...newParatroopers].map(
        (para) => {
          if (para.landed) {
            // Move landed troopers towards the bunker side
            const bunkerWidth = 64; // Half of bunker width (132/2)
            const landedLeft = para.position.x < GUN_POSITION.x;
            const targetX = landedLeft
              ? GUN_POSITION.x - bunkerWidth
              : GUN_POSITION.x + bunkerWidth;
            const dx = targetX - para.position.x;
            const moveSpeed = 30; // pixels per second

            if (Math.abs(dx) > 5) {
              // Still moving towards bunker side
              const moveX = Math.sign(dx) * moveSpeed * dt;
              return {
                ...para,
                position: {
                  x: para.position.x + moveX,
                  y: para.position.y,
                },
              };
            }
            // Reached bunker side
            return para;
          }

          const newY = para.position.y + para.velocity.y * dt;
          const parachuteOpen =
            newY > PARACHUTE_OPEN_HEIGHT || para.parachuteOpen;
          const velocity = parachuteOpen ? { x: 0, y: 50 } : { x: 0, y: 150 };

          if (newY >= GROUND_Y) {
            return {
              ...para,
              position: { x: para.position.x, y: GROUND_Y },
              landed: true,
              parachuteOpen,
            };
          }

          return {
            ...para,
            position: { x: para.position.x, y: newY },
            velocity,
            parachuteOpen,
          };
        }
      );

      // Update bullets
      let bullets = state.bullets.map((bullet) => ({
        ...bullet,
        position: {
          x: bullet.position.x + bullet.velocity.x * dt,
          y: bullet.position.y + bullet.velocity.y * dt,
        },
      }));

      // Remove bullets that flew off screen
      bullets = bullets.filter(
        (bullet) =>
          bullet.position.x > -10 &&
          bullet.position.x < GAME_WIDTH + 10 &&
          bullet.position.y > -10 &&
          bullet.position.y < GAME_HEIGHT + 10
      );

      // Update explosions
      let explosions = state.explosions.map((exp) => ({
        ...exp,
        frame: exp.frame + 1,
      }));

      // Remove finished explosions
      explosions = explosions.filter((exp) => exp.frame < 10);

      // Collision detection
      let score = state.score;
      const bulletsToRemove = new Set<string>();
      const helicoptersToRemove = new Set<string>();
      const paratroopersToRemove = new Set<string>();
      const newExplosions: Explosion[] = [];

      // Bullets vs Helicopters
      bullets.forEach((bullet) => {
        helicopters.forEach((heli) => {
          if (checkCollision(bullet.position, heli.position, 5, 25)) {
            bulletsToRemove.add(bullet.id);
            helicoptersToRemove.add(heli.id);
            score += 50;
            newExplosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { ...heli.position },
              frame: 0,
            });
          }
        });
      });

      // Bullets vs Paratroopers
      bullets.forEach((bullet) => {
        paratroopers.forEach((para) => {
          if (
            !para.landed &&
            checkCollision(bullet.position, para.position, 5, 15)
          ) {
            bulletsToRemove.add(bullet.id);
            paratroopersToRemove.add(para.id);
            score += 25;
            newExplosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { ...para.position },
              frame: 0,
            });
          }
        });
      });

      // Bullets vs Bombers
      const bombersToRemove = new Set<string>();
      bullets.forEach((bullet) => {
        bombers.forEach((bomber) => {
          if (checkCollision(bullet.position, bomber.position, 5, 30)) {
            bulletsToRemove.add(bullet.id);
            bombersToRemove.add(bomber.id);
            score += 150;
            newExplosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { ...bomber.position },
              frame: 0,
            });
          }
        });
      });

      // Bullets vs Bombs
      const bombsToRemove = new Set<string>();
      bullets.forEach((bullet) => {
        bombs.forEach((bomb) => {
          if (checkCollision(bullet.position, bomb.position, 5, 10)) {
            bulletsToRemove.add(bullet.id);
            bombsToRemove.add(bomb.id);
            score += 100;
            newExplosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { ...bomb.position },
              frame: 0,
            });
          }
        });
      });

      // Bombs vs Bunker (Instakill) - check BEFORE filtering
      let bombHitBunker = false;
      bombs.forEach((bomb) => {
        if (checkCollision(bomb.position, GUN_POSITION, 10, BUNKER_RADIUS)) {
          bombHitBunker = true;
          const bunkerExplosion: Explosion = {
            id: `explosion-bunker-${Date.now()}`,
            position: { ...GUN_POSITION },
            frame: 0,
          };
          const bombExplosion: Explosion = {
            id: `explosion-bomb-${Date.now()}`,
            position: { ...bomb.position },
            frame: 0,
          };

          explosions = [...explosions, bunkerExplosion, bombExplosion];
        }
      });

      // If bomb hit bunker, trigger immediate game over
      if (bombHitBunker && state.gameStatus === "playing") {
        return {
          ...state,
          score,
          helicopters: [],
          bombers: [],
          bombs: [],
          paratroopers,
          bullets,
          explosions,
          landedTroopers: state.landedTroopers,
          gameStatus: "destroying",
          destroyingStartTime: Date.now(),
        };
      }
      bullets = bullets.filter((b) => !bulletsToRemove.has(b.id));
      helicopters = helicopters.filter((h) => !helicoptersToRemove.has(h.id));
      bombers = bombers.filter((b) => !bombersToRemove.has(b.id));
      bombs = bombs.filter((b) => !bombsToRemove.has(b.id));
      paratroopers = paratroopers.filter(
        (p) => !paratroopersToRemove.has(p.id)
      );
      explosions = [...explosions, ...newExplosions];

      // Count troopers that reached the bunker on each side
      const bunkerWidth = 64;
      const landedOnLeft = paratroopers.filter((p) => {
        if (!p.landed) return false;
        const atBunkerSide =
          Math.abs(p.position.x - GUN_POSITION.x) <= bunkerWidth + 5;
        const isLeft = p.position.x < GUN_POSITION.x;
        return atBunkerSide && isLeft;
      }).length;

      const landedOnRight = paratroopers.filter((p) => {
        if (!p.landed) return false;
        const atBunkerSide =
          Math.abs(p.position.x - GUN_POSITION.x) <= bunkerWidth + 5;
        const isRight = p.position.x >= GUN_POSITION.x;
        return atBunkerSide && isRight;
      }).length;

      const landedTroopers = landedOnLeft + landedOnRight;

      // Check for destroying state - game over if 4 on one side
      if (
        (landedOnLeft >= MAX_LANDED_TROOPERS ||
          landedOnRight >= MAX_LANDED_TROOPERS) &&
        state.gameStatus === "playing"
      ) {
        // Add explosion at gunner position
        const gunnerExplosion: Explosion = {
          id: `explosion-gunner-${Date.now()}`,
          position: { ...GUN_POSITION },
          frame: 0,
        };

        return {
          ...state,
          score,
          helicopters,
          bombers,
          bombs,
          paratroopers,
          bullets,
          explosions: [...explosions, gunnerExplosion],
          landedTroopers,
          gameStatus: "destroying",
          destroyingStartTime: Date.now(),
        };
      }

      // Check if destroying animation is complete (2 seconds)
      if (
        state.gameStatus === "destroying" &&
        Date.now() - state.destroyingStartTime > 2000
      ) {
        return {
          ...state,
          score,
          helicopters,
          bombers,
          bombs,
          paratroopers,
          bullets,
          explosions,
          landedTroopers,
          gameStatus: "gameOver",
        };
      }

      return {
        ...state,
        score,
        helicopters,
        bombers,
        bombs,
        paratroopers,
        bullets,
        explosions,
        landedTroopers,
      };
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return { state, dispatch };
}

export { GUN_POSITION, GAME_WIDTH, GAME_HEIGHT, GROUND_Y };
