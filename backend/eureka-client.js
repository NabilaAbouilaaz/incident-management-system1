const axios = require('axios');

const REGISTRY_URL = process.env.REGISTRY_URL || 'http://localhost:8761';

function buildInstance(appName, port, healthPath) {
  const now = Date.now().toString();
  return {
    instance: {
      instanceId: `localhost:${appName.toLowerCase()}:${port}`,
      hostName: 'localhost',
      app: appName.toUpperCase(),
      ipAddr: '127.0.0.1',
      status: 'UP',
      overriddenstatus: 'UNKNOWN',
      port: { '$': port, '@enabled': 'true' },
      securePort: { '$': 443, '@enabled': 'false' },
      countryId: 1,
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn'
      },
      leaseInfo: {
        renewalIntervalInSecs: 30,
        durationInSecs: 90,
        registrationTimestamp: 0,
        lastRenewalTimestamp: 0,
        evictionTimestamp: 0,
        serviceUpTimestamp: 0
      },
      metadata: { '@class': 'java.util.Collections$EmptyMap' },
      homePageUrl: `http://localhost:${port}/`,
      statusPageUrl: `http://localhost:${port}${healthPath}`,
      healthCheckUrl: `http://localhost:${port}${healthPath}`,
      vipAddress: appName.toLowerCase(),
      secureVipAddress: appName.toLowerCase(),
      isCoordinatingDiscoveryServer: 'false',
      lastUpdatedTimestamp: now,
      lastDirtyTimestamp: now
    }
  };
}

async function registerWithEureka(appName, port, healthPath = '/health') {
  const body = buildInstance(appName, port, healthPath);
  try {
    await axios.post(
      `${REGISTRY_URL}/eureka/apps/${appName.toUpperCase()}`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log(`✅ [${appName}] Enregistré dans Eureka`);
  } catch (e) {
    console.warn(`⚠️  [${appName}] Eureka non disponible (${e.message})`);
  }
}

async function sendHeartbeat(appName, port) {
  const instanceId = `localhost:${appName.toLowerCase()}:${port}`;
  try {
    await axios.put(`${REGISTRY_URL}/eureka/apps/${appName.toUpperCase()}/${instanceId}`);
  } catch {}
}

function startEurekaClient(appName, port, healthPath = '/health') {
  setTimeout(async () => {
    await registerWithEureka(appName, port, healthPath);
    setInterval(() => sendHeartbeat(appName, port), 30000);
  }, 3000);
}

module.exports = { startEurekaClient };
