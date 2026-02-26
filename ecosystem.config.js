module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
