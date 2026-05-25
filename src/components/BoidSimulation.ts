import { PresetConfig } from '../types';

export class Vector2D {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(v: Vector2D): Vector2D {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector2D): Vector2D {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n: number): Vector2D {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n: number): Vector2D {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  setMag(len: number): Vector2D {
    return this.normalize().mult(len);
  }

  normalize(): Vector2D {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max: number): Vector2D {
    if (this.mag() > max) {
      this.setMag(max);
    }
    return this;
  }

  dist(v: Vector2D): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  copy(): Vector2D {
    return new Vector2D(this.x, this.y);
  }
}

export class Boid {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  history: Vector2D[];
  id: number;
  flapPhase: number;
  flapSpeed: number;
  
  // Custom naming/coloring
  customName: string | null = null;
  customColor: string | null = null;
  groupId: number;

  constructor(x: number, y: number, id: number) {
    this.position = new Vector2D(x, y);
    // Random starting velocity (scaled for 144fps feel at 60fps)
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 2 + 2) * 2.4;
    this.velocity = new Vector2D(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.acceleration = new Vector2D(0, 0);
    this.history = [];
    this.id = id;
    this.groupId = Math.floor(Math.random() * 4); // 4 split subgroups
    this.flapPhase = Math.random() * Math.PI * 2;
    this.flapSpeed = 0.15 + Math.random() * 0.1;
  }

  update(config: PresetConfig, maxHistory: number) {
    // Keep history path
    this.history.push(this.position.copy());
    if (this.history.length > maxHistory) {
      this.history.shift();
    }

    // Wing flapping (scales naturally with scaled velocity mag)
    this.flapPhase += this.flapSpeed * (this.velocity.mag() * 0.4 + 0.2);

    this.velocity.add(this.acceleration);
    this.velocity.limit(config.maxSpeed * 2.4);
    this.position.add(this.velocity);
    this.acceleration.mult(0); // Reset acceleration each frame
  }

  applyForce(force: Vector2D) {
    this.acceleration.add(force);
  }

  // Border steering to keep flock on screen naturally
  borders(width: number, height: number) {
    const margin = 100;
    const steer = new Vector2D(0, 0);
    const forceFactor = 0.5 * 2.4;

    if (this.position.x < margin) {
      steer.x = forceFactor * (1 - this.position.x / margin);
    } else if (this.position.x > width - margin) {
      steer.x = -forceFactor * (1 - (width - this.position.x) / margin);
    }

    if (this.position.y < margin) {
      steer.y = forceFactor * (1 - this.position.y / margin);
    } else if (this.position.y > height - margin) {
      steer.y = -forceFactor * (1 - (height - this.position.y) / margin);
    }

    if (steer.mag() > 0) {
      this.applyForce(steer);
    }
  }

  // Dynamic behaviors
  runFlockRules(boids: Boid[], config: PresetConfig, width: number, height: number, mousePos: Vector2D | null, mouseMode: 'attract' | 'repel' | 'none', predator: Predator | null) {
    // Vector steering caches
    let sepSteer = new Vector2D(0, 0);
    let alignSteer = new Vector2D(0, 0);
    let cohSteer = new Vector2D(0, 0);

    let sepCount = 0;
    let alignCount = 0;
    let cohCount = 0;

    const separationDist = 25; // Minimum space between boids
    const visualRange = config.visualRange;

    let alignWeightSum = 0;
    let cohWeightSum = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other.id === this.id) continue;

      const d = this.position.dist(other.position);

      if (d < separationDist) {
        const diff = this.position.copy().sub(other.position);
        diff.normalize();
        diff.div(d); // Weight closer obstacles heavier
        sepSteer.add(diff);
        sepCount++;
      }

      if (d < visualRange) {
        const isSameGroup = other.groupId === this.groupId;
        const weight = isSameGroup ? 1.0 : 0.08; // High affinity for subclass group, low for other branches

        // Alignment
        alignSteer.add(other.velocity.copy().mult(weight));
        alignCount++;
        alignWeightSum += weight;

        // Cohesion
        cohSteer.add(other.position.copy().mult(weight));
        cohCount++;
        cohWeightSum += weight;
      }
    }

    // Wrap-up Separation
    if (sepCount > 0) {
      sepSteer.div(sepCount);
      if (sepSteer.mag() > 0) {
        sepSteer.normalize();
        sepSteer.mult(config.maxSpeed * 2.4);
        sepSteer.sub(this.velocity);
        sepSteer.limit(config.maxForce * 1.5 * 2.4);
      }
    }

    // Wrap-up Alignment
    if (alignCount > 0 && alignWeightSum > 0) {
      alignSteer.div(alignWeightSum);
      alignSteer.normalize();
      alignSteer.mult(config.maxSpeed * 2.4);
      alignSteer.sub(this.velocity);
      alignSteer.limit(config.maxForce * 2.4);
    }

    // Wrap-up Cohesion
    if (cohCount > 0 && cohWeightSum > 0) {
      cohSteer.div(cohWeightSum);
      cohSteer.sub(this.position); // Direction pointing to center
      cohSteer.normalize();
      cohSteer.mult(config.maxSpeed * 2.4);
      cohSteer.sub(this.velocity);
      cohSteer.limit(config.maxForce * 2.4);
    }

    // Apply weights
    sepSteer.mult(config.separationWeight);
    alignSteer.mult(config.alignmentWeight);
    cohSteer.mult(config.cohesionWeight);

    this.applyForce(sepSteer);
    this.applyForce(alignSteer);
    this.applyForce(cohSteer);

    // Apply Wind
    if (config.windSpeed > 0) {
      const radAngle = (config.windAngle * Math.PI) / 180;
      const windForce = new Vector2D(Math.cos(radAngle), Math.sin(radAngle));
      windForce.mult(config.windSpeed * 0.015 * 2.4);
      this.applyForce(windForce);
    }

    // Apply Mouse Interactions
    if (mousePos && mouseMode !== 'none') {
      const d = this.position.dist(mousePos);
      if (mouseMode === 'attract') {
        if (d < 300) {
          const steer = mousePos.copy().sub(this.position);
          steer.normalize();
          steer.mult(config.maxSpeed * 1.2 * 2.4);
          steer.sub(this.velocity);
          steer.limit(config.maxForce * 1.8 * 2.4);
          this.applyForce(steer);
        }
      } else if (mouseMode === 'repel') {
        if (d < 180) {
          const steer = this.position.copy().sub(mousePos);
          steer.normalize();
          // The closer, the stronger the panic
          const strength = (180 - d) / 180;
          steer.mult(config.maxSpeed * (1.5 + strength) * 2.4);
          steer.sub(this.velocity);
          steer.limit(config.maxForce * 3.5 * 2.4);
          this.applyForce(steer);
        }
      }
    }

    // Flee from Predator
    if (predator && config.hasPredator) {
      const d = this.position.dist(predator.position);
      if (d < 180) {
        const steer = this.position.copy().sub(predator.position);
        steer.normalize();
        const factor = (180 - d) / 180;
        steer.mult(config.maxSpeed * (1.8 + factor * 2) * 2.4);
        steer.sub(this.velocity);
        steer.limit(config.maxForce * 3.8 * 2.4);
        this.applyForce(steer);
      }
    }

    // Keep within bounds
    this.borders(width, height);
  }
}

export class Predator {
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  flapPhase: number;

  constructor(x: number, y: number) {
    this.position = new Vector2D(x, y);
    const angle = Math.random() * Math.PI * 2;
    this.velocity = new Vector2D(Math.cos(angle) * 3 * 2.4, Math.sin(angle) * 3 * 2.4);
    this.size = 14;
    this.flapPhase = 0;
  }

  update(width: number, height: number, speed: number, boids: Boid[]) {
    // Steer towards center of flock if boids exist, or follow circular hunt path
    this.flapPhase += 0.12 * 2.4;

    let target = new Vector2D(width / 2, height / 2);
    if (boids.length > 0) {
      // Find average position of a subset of boids to hunt dynamically
      let sumX = 0;
      let sumY = 0;
      const sampleSize = Math.min(20, boids.length);
      for (let i = 0; i < sampleSize; i++) {
        // Sample random index
        const idx = Math.floor(Math.random() * boids.length);
        sumX += boids[idx].position.x;
        sumY += boids[idx].position.y;
      }
      target = new Vector2D(sumX / sampleSize, sumY / sampleSize);
    }

    // Seek target
    const desired = target.sub(this.position);
    desired.normalize();
    desired.mult(speed * 2.4);

    const steer = desired.sub(this.velocity);
    steer.limit(0.18 * 2.4); // Agility limit of predator
    this.velocity.add(steer);
    this.velocity.limit(speed * 2.4);
    this.position.add(this.velocity);

    // Bounce off edges lightly so predator doesn't get stuck
    const m = 50;
    if (this.position.x < m) {
      this.velocity.x = Math.abs(this.velocity.x);
    } else if (this.position.x > width - m) {
      this.velocity.x = -Math.abs(this.velocity.x);
    }
    if (this.position.y < m) {
      this.velocity.y = Math.abs(this.velocity.y);
    } else if (this.position.y > height - m) {
      this.velocity.y = -Math.abs(this.velocity.y);
    }
  }
}
