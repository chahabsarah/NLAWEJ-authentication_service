const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const Consul = require('consul');
const chalk = require('chalk');

const app = express();
const PORT = 8081;

const consul = new Consul({
  host: 'consul',
  port: 8500,
  promisify: true
});

const SERVICE_CONFIG = {
  'authentication-service': { basePath: '/authentication', targetPath: '/', protocol: 'http' },
  'project-service': { basePath: '/project', targetPath: '/', protocol: 'http' },
  'blogs-promotions-service': { basePath: '/blogs-promotions', targetPath: '/', protocol: 'http' },
  'geo-service': { basePath: '/geo', targetPath: '/', protocol: 'http' },
  'messaging-service': { basePath: '/messaging', targetPath: '/', protocol: 'http' },
  'notification-service': { basePath: '/notification', targetPath: '/', protocol: 'http' },
  'offres-promotions-service': { basePath: '/offres-promotions', targetPath: '/', protocol: 'http' },
  'payment-service': { basePath: '/payment', targetPath: '/', protocol: 'http' },
  'rating-service': { basePath: '/rating', targetPath: '/', protocol: 'http' }
};

const roundRobinIndex = {};

// Obtenir l'adresse d'une instance saine (round-robin)
async function getServiceAddress(serviceName) {
  try {
    const result = await consul.health.service({ service: serviceName, passing: true });
    const healthyInstances = result.map(entry => entry.Service);

    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances of ${serviceName} found`);
    }

    roundRobinIndex[serviceName] = (roundRobinIndex[serviceName] || 0) % healthyInstances.length;
    const instance = healthyInstances[roundRobinIndex[serviceName]];
    roundRobinIndex[serviceName]++;

    const address = `${SERVICE_CONFIG[serviceName].protocol}://${instance.Address}:${instance.Port}`;
    console.log(chalk.green(`[${serviceName}] Proxy → ${address}`));
    return address;
  } catch (error) {
    console.error(chalk.red(`[Consul] Error resolving ${serviceName}: ${error.message}`));
    throw error;
  }
}

// Middleware proxy pour chaque service
function createProxy(serviceName) {
  return async (req, res, next) => {
    try {
      const target = await getServiceAddress(serviceName);
      const config = SERVICE_CONFIG[serviceName];

      const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        secure: false,
        timeout: 5000,
        pathRewrite: {
          [`^${config.basePath}`]: config.targetPath
        },
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
          proxyReq.setHeader('X-Forwarded-Path', req.originalUrl);
        },
        logLevel: 'error'
      });

      return proxy(req, res, next);
    } catch (err) {
      res.status(503).json({
        error: 'Service Unavailable',
        service: serviceName,
        message: err.message
      });
    }
  };
}

// Enregistrement dynamique des routes
for (const [serviceName, config] of Object.entries(SERVICE_CONFIG)) {
  app.use(config.basePath, createProxy(serviceName));
}

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: Object.keys(SERVICE_CONFIG)
  });
});

// Gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error(chalk.red('[Global Error]:'), err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Lancer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(chalk.cyan(`API Gateway is running on port ${PORT}`));
  Object.entries(SERVICE_CONFIG).forEach(([name, config]) => {
    console.log(chalk.gray(`↪ ${config.basePath} → ${name}`));
  });

  // S'enregistrer dans Consul
  consul.agent.service.register({
    id: 'api-gateway',
    name: 'api-gateway',
    address: 'api-gateway',
    port: PORT,
    check: {
      http: `http://api-gateway:${PORT}/health`,
      interval: '10s',
      timeout: '5s'
    }
  }, (err) => {
    if (err) {
      console.error(chalk.red('Failed to register API Gateway with Consul:'), err);
    } else {
      console.log(chalk.green('API Gateway registered with Consul'));
    }
  });
});
