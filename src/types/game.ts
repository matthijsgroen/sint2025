export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Helicopter {
  id: string;
  position: Position;
  direction: "left" | "right";
  speed: number;
  dropCooldown: number;
  health: number;
}

export interface Paratrooper {
  id: string;
  position: Position;
  velocity: Velocity;
  parachuteOpen: boolean;
  landed: boolean;
}

export interface Bullet {
  id: string;
  position: Position;
  velocity: Velocity;
  active: boolean;
}

export interface Explosion {
  id: string;
  position: Position;
  frame: number;
}

export interface GameState {
  score: number;
  wave: number;
  landedTroopers: number;
  helicoptersSpawnedThisWave: number;
  gameStatus: "menu" | "playing" | "destroying" | "gameOver";
  helicopters: Helicopter[];
  paratroopers: Paratrooper[];
  bullets: Bullet[];
  explosions: Explosion[];
  gunAngle: number;
  lastFireTime: number;
  destroyingStartTime: number;
}

export type GameAction =
  | { type: "START_GAME" }
  | { type: "GAME_OVER" }
  | { type: "SET_DESTROYING"; timestamp: number }
  | { type: "UPDATE_GUN_ANGLE"; angle: number }
  | {
      type: "FIRE_BULLET";
      position: Position;
      velocity: Velocity;
      timestamp: number;
    }
  | { type: "SPAWN_HELICOPTER"; helicopter: Helicopter }
  | { type: "UPDATE_ENTITIES"; deltaTime: number }
  | { type: "ADD_EXPLOSION"; position: Position }
  | { type: "NEXT_WAVE" };
