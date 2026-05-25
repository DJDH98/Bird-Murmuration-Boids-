import { PresetConfig } from '../types';

export const ATMOSPHERIC_PRESETS: PresetConfig[] = [
  {
    id: 'foggy_baker_street',
    name: 'Misty Baker Street',
    description: 'Thick, cold smog curls around Mr Holmes’ window. Birds drift lazily like shifting smoke shadows.',
    boidCount: 220,
    maxSpeed: 2.2, // Slowed down from 3.0
    maxForce: 0.06,
    separationWeight: 2.0,
    alignmentWeight: 1.0,
    cohesionWeight: 1.4,
    visualRange: 90,
    trailLength: 0.94,
    bgColorStart: '#2d333b', // Cold slate blue-grey
    bgColorEnd: '#ccd1d9',   // Bleak smoggy cream
    boidColor: '#1d2127',    // Charcoal silhouettes
    windSpeed: 1,
    windAngle: 210,
    hasPredator: false,
    predatorSpeed: 3.2,
    trailType: 'pencil'
  }
];

