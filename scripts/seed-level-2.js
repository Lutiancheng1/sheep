const http = require('http');

// Level 2 Configuration
// Total tiles: 36 (Divisible by 3)
// Types: 6 (grass, coin, carrot, stone, wood, wheat)
// Each type count: 6 (Divisible by 3)
const TILE_TYPES = ['grass', 'coin', 'carrot', 'stone', 'wood', 'wheat'];
const TILES_PER_TYPE = 6;

function generateLevel2Data() {
  const tiles = [];
  
  // Create balanced pool of types
  const typePool = [];
  for (const type of TILE_TYPES) {
    for (let i = 0; i < TILES_PER_TYPE; i++) {
      typePool.push(type);
    }
  }

  // Shuffle types
  for (let i = typePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = typePool[i];
    typePool[i] = typePool[j];
    typePool[j] = temp;
  }

  let tileIndex = 0;

  // Layer 0 (Base) - 4x4
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (tileIndex >= typePool.length) break;
      tiles.push({
        id: `l2-t${tileIndex}`,
        type: typePool[tileIndex++],
        x: 150 + col * 80,
        y: 300 + row * 80,
        layer: 0
      });
    }
  }

  // Layer 1 - 3x3 (Offset)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (tileIndex >= typePool.length) break;
      tiles.push({
        id: `l2-t${tileIndex}`,
        type: typePool[tileIndex++],
        x: 190 + col * 80,
        y: 340 + row * 80,
        layer: 1
      });
    }
  }

  // Layer 2 - 2x2 (Offset)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      if (tileIndex >= typePool.length) break;
      tiles.push({
        id: `l2-t${tileIndex}`,
        type: typePool[tileIndex++],
        x: 230 + col * 80,
        y: 380 + row * 80,
        layer: 2
      });
    }
  }

  // Remaining tiles (scattered)
  while (tileIndex < typePool.length) {
    tiles.push({
      id: `l2-t${tileIndex}`,
      type: typePool[tileIndex++],
      x: 100 + Math.random() * 500,
      y: 200 + Math.random() * 600,
      layer: Math.floor(Math.random() * 3) // Random layer
    });
  }

  return { tiles };
}

function seedLevel2() {
  const levelData = {
    levelId: 'level-2',
    difficulty: 2,
    data: generateLevel2Data()
  };

  const data = JSON.stringify(levelData);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/levels',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Level 2 seeded successfully!');
      } else {
        console.error(`❌ Failed to seed Level 2: Status ${res.statusCode}`);
        console.error('Response:', responseBody);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error seeding Level 2:', error);
  });

  req.write(data);
  req.end();
}

seedLevel2();
