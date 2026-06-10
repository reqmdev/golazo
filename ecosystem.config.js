module.exports = {
    apps: [
        {
            name: 'golazo',
            script: 'src/index.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            kill_timeout: 10_000,
            listen_timeout: 30_000,
            env: {
                NODE_ENV: 'production',
                GOLAZO_LOG_FORMAT: 'json',
                GOLAZO_HEALTH_PORT: '8080',
            },
        },
    ],
};