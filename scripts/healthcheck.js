const port = Number(process.env.GOLAZO_HEALTH_PORT) || 8080;

fetch(`http://127.0.0.1:${port}/health`)
    .then((response) => process.exit(response.ok ? 0 : 1))
    .catch(() => process.exit(1));