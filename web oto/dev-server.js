const { spawn } = require('child_process');
const os = require('os');

console.log('Starting TQ Auto Showroom development services...');

const isWin = os.platform() === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

// Spawn Next.js Dev Server
const nextDev = spawn(npxCmd, ['next', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Spawn Socket.IO Server
const socketServer = spawn(npxCmd, ['tsx', 'src/lib/socket/socket-server.ts'], {
  stdio: 'inherit',
  shell: true
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
});

socketServer.on('error', (err) => {
  console.error('Failed to start Socket.IO server:', err);
});

// Clean up both processes on exit
const cleanup = () => {
  console.log('\nShutting down TQ Auto development services...');
  nextDev.kill();
  socketServer.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
