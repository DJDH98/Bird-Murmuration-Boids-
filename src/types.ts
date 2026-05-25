export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  boidCount: number;
  maxSpeed: number;
  maxForce: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  visualRange: number;
  trailLength: number; // 0 to 1 opacity persistence
  bgColorStart: string;
  bgColorEnd: string;
  boidColor: string;
  windSpeed: number;
  windAngle: number; // in degrees
  hasPredator: boolean;
  predatorSpeed: number;
  trailType: 'classic' | 'ribbon' | 'pencil' | 'dots';
}

export interface NamedBird {
  id: string;
  name: string;
  color: string;
}

export interface Quote {
  text: string;
  source: string;
  type: string;
}

