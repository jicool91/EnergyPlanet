import client from 'prom-client';
import { config } from '../config';

const metricsEnabled = config.prometheus.enabled;

const register = new client.Registry();

if (metricsEnabled) {
  client.collectDefaultMetrics({
    register,
    prefix: 'energyplanet_',
  });
}

export { register, metricsEnabled };
