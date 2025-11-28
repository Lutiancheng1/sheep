const http = require('http');

const API_URL = {
  hostname: 'localhost',
  port: 3001,
  path: '/levels',
  method: 'POST'
};

// Helper to shuffle array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper to generate tile pool
function generateTilePool(types, countPerType) {
  const pool = [];
  for (const type of types) {
    for (let i = 0; i < countPerType; i++) {
      pool.push(type);
    }
  }
  return shuffle(pool);
}

// --- Level 1: Tutorial (Very Easy) ---
// 18 tiles, 3 types (carrot, grass, wood), 6 of each.
function generateLevel1() {
  const types = ['carrot', 'grass', 'wood'];
  const pool = generateTilePool(types, 6);
  const tiles = [];
  let idx = 0;

  // Layer 0: 3x3 grid (9 tiles)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l1-t${idx}`,
        type: pool[idx++],
        x: 295 + c * 80,
        y: 400 + r * 80,
        layer: 0
      });
    }
  }

  // Layer 1: 2x2 grid (4 tiles)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l1-t${idx}`,
        type: pool[idx++],
        x: 335 + c * 80,
        y: 440 + r * 80,
        layer: 1
      });
    }
  }

  // Remaining 5 tiles scattered
  while (idx < pool.length) {
    tiles.push({
      id: `l1-t${idx}`,
      type: pool[idx++],
      x: 200 + Math.random() * 350,
      y: 300 + Math.random() * 400,
      layer: 2
    });
  }

  return { levelId: 'level-1', difficulty: 1, data: { tiles } };
}

// --- Level 2: Medium (The "Fixed" one) ---
// 36 tiles, 6 types, 6 of each.
function generateLevel2() {
  const types = ['grass', 'coin', 'carrot', 'stone', 'wood', 'wheat'];
  const pool = generateTilePool(types, 6);
  const tiles = [];
  let idx = 0;

  // Layer 0: 4x4 (16)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l2-t${idx}`,
        type: pool[idx++],
        x: 255 + c * 80,
        y: 350 + r * 80,
        layer: 0
      });
    }
  }

  // Layer 1: 3x3 (9)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l2-t${idx}`,
        type: pool[idx++],
        x: 295 + c * 80,
        y: 390 + r * 80,
        layer: 1
      });
    }
  }

  // Layer 2: 2x2 (4)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l2-t${idx}`,
        type: pool[idx++],
        x: 335 + c * 80,
        y: 430 + r * 80,
        layer: 2
      });
    }
  }

  // Remaining 7 scattered
  while (idx < pool.length) {
    tiles.push({
      id: `l2-t${idx}`,
      type: pool[idx++],
      x: 150 + Math.random() * 450,
      y: 300 + Math.random() * 500,
      layer: Math.floor(Math.random() * 3)
    });
  }

  return { levelId: 'level-2', difficulty: 2, data: { tiles } };
}

// --- Level 3: Hard ---
// 63 tiles, 7 types, 9 of each.
function generateLevel3() {
  const types = ['grass', 'coin', 'carrot', 'stone', 'wood', 'wheat', 'shovel'];
  const pool = generateTilePool(types, 9);
  const tiles = [];
  let idx = 0;

  // Layer 0: 5x5 (25)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l3-t${idx}`,
        type: pool[idx++],
        x: 215 + c * 80,
        y: 300 + r * 80,
        layer: 0
      });
    }
  }

  // Layer 1: 4x4 (16)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l3-t${idx}`,
        type: pool[idx++],
        x: 255 + c * 80,
        y: 340 + r * 80,
        layer: 1
      });
    }
  }

  // Layer 2: 3x3 (9)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (idx >= pool.length) break;
      tiles.push({
        id: `l3-t${idx}`,
        type: pool[idx++],
        x: 295 + c * 80,
        y: 380 + r * 80,
        layer: 2
      });
    }
  }

  // Remaining 13 scattered
  while (idx < pool.length) {
    tiles.push({
      id: `l3-t${idx}`,
      type: pool[idx++],
      x: 100 + Math.random() * 550,
      y: 200 + Math.random() * 600,
      layer: Math.floor(Math.random() * 4)
    });
  }

  return { levelId: 'level-3', difficulty: 3, data: { tiles } };
}

function postLevel(levelData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(levelData);
    const options = {
      ...API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${levelData.levelId} seeded.`);
          resolve();
        } else {
          console.error(`❌ Failed ${levelData.levelId}: ${res.statusCode} ${body}`);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error ${levelData.levelId}:`, e);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

async function seedAll() {
  try {
    await postLevel(generateLevel1());
    await postLevel(generateLevel2());
    await postLevel(generateLevel3());
    console.log('🎉 All levels seeded successfully!');
  } catch (e) {
    console.error('💥 Seeding failed.');
    process.exit(1);
  }
}

seedAll();
