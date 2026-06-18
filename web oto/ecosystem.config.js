module.exports = {
  apps: [
    {
      name: "tq-auto-nextjs",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "tq-auto-socket-server",
      script: "npx",
      args: "tsx src/lib/socket/socket-server.ts",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        SOCKET_PORT: 3001
      }
    }
  ]
};
