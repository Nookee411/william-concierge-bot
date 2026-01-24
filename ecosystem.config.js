module.exports = {
  apps: [
    {
      name: 'concierge-bot',
      script: './dist/src/index.js',
      instances: 1,
      exec_mode: 'fork',

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,

      // Memory management
      max_memory_restart: '500M',

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },

      // Advanced settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 3000,

      // Restart conditions
      cron_restart: '0 3 * * *', // Restart daily at 3 AM

      // Process management
      stop_exit_codes: [0],
    },
  ],
};
