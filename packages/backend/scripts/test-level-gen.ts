import { LevelGenerator } from '../src/levels/level-generator';

function run() {
  const generator = new LevelGenerator();
  const types = ['A', 'B', 'C', 'D', 'E', 'F'];

  console.log('Starting Level Generation Test...');

  let totalDigs = 0;
  let totalMatches = 0;
  let totalUnassigned = 0;
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    // Simulate Level 2 (Hard)
    const config = {
      tiles: 210,
      layers: 20,
      pattern: 'dense_pile',
      size: 6,
    };

    const result = generator.generate(config, types);

    totalDigs += result.stats.digCount;
    totalMatches += result.stats.matchCount;
    totalUnassigned += result.stats.unassignedCount;

    if (result.stats.unassignedCount > 0) {
      console.error(`Iteration ${i} failed: ${result.stats.unassignedCount} unassigned tiles.`);
    }
  }

  console.log('--- Results (Avg per level) ---');
  console.log(`Total Levels: ${iterations}`);
  console.log(`Avg Digs (Delayed Matches): ${(totalDigs / iterations).toFixed(2)}`);
  console.log(`Avg Matches (Direct): ${(totalMatches / iterations).toFixed(2)}`);
  console.log(`Avg Unassigned (Failures): ${(totalUnassigned / iterations).toFixed(2)}`);

  const delayedRatio = totalDigs / (totalDigs + totalMatches);
  console.log(`Delayed Match Ratio: ${(delayedRatio * 100).toFixed(2)}%`);

  if (delayedRatio > 0.1) {
    console.log('SUCCESS: Algorithm is generating delayed matches.');
  } else {
    console.log('WARNING: Delayed match ratio is low. Difficulty might be too low.');
  }
}

run();
