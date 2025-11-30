const { spawn, execSync, exec } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

console.log('\x1b[32m%s\x1b[0m', '🐑 Sheep Game - Cross-Platform Start Script');
console.log('===========================================');

// 1. Start Docker
console.log('[1/4] Starting Database (Docker)...');
const backendDir = path.join(__dirname, 'packages', 'backend');

try {
    // Check if docker-compose exists
    execSync('docker-compose --version', { stdio: 'ignore' });
    execSync('docker-compose up -d', { cwd: backendDir, stdio: 'inherit' });
    console.log('\x1b[32m%s\x1b[0m', '✔ Docker services started');
} catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Failed to start Docker containers. Please ensure Docker Desktop is running.');
    // We don't exit here, allowing user to proceed if they are running DB locally
}

// Helper to open terminal
function openTerminal(name, dir) {
    const command = 'npm run dev';

    if (isWindows) {
        // Windows: start "Title" /D "Path" cmd /k "Command"
        // Use exec to avoid spawn's argument escaping issues
        exec(`start "${name}" /D "${dir}" cmd /k "${command}"`);
    } else if (isMac) {
        // Mac: osascript -e 'tell app "Terminal" ...'
        const appleScript = `
      tell application "Terminal"
        do script "cd '${dir}' && echo '\\033[32mStarting ${name}...\\033[0m' && ${command}"
        activate
      end tell
    `;
        spawn('osascript', ['-e', appleScript], { detached: true, stdio: 'ignore' });
    } else {
        // Linux/Other: Just log instructions
        console.log(`\x1b[33m[Manual Action Required]\x1b[0m Please run in new terminal:`);
        console.log(`  cd ${dir} && ${command}`);
    }
}

// 2. Start Services
console.log('[2/4] Starting Backend (Port 3001)...');
openTerminal('Sheep Backend', path.join(__dirname, 'packages', 'backend'));

console.log('[3/4] Starting Admin (Port 3002)...');
openTerminal('Sheep Admin', path.join(__dirname, 'packages', 'admin'));

console.log('[4/4] Starting Frontend (Port 3000)...');
openTerminal('Sheep Frontend', path.join(__dirname, 'packages', 'frontend'));

console.log('===========================================');
console.log('🚀 Services are launching in separate windows...');
console.log('   Frontend: \x1b[36mhttp://localhost:3000\x1b[0m');
console.log('   Backend:  \x1b[36mhttp://localhost:3001\x1b[0m');
console.log('   Admin:    \x1b[36mhttp://localhost:3002\x1b[0m');
console.log('===========================================');
