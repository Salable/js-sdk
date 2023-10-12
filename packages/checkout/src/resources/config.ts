const SALABLE_PUBLISHABLE_KEY = process.env.SALABLE_PUBLISHABLE_KEY?.trim();
const SALABLE_LIVE_KEY = process.env.SALABLE_LIVE_KEY?.trim();
const SALABLE_BASE_URL = process.env.SALABLE_BASE_URL?.trim();
const CDN_DOMAIN = process.env.CDN_DOMAIN?.trim();
const ENVIRONMENT = process.env.ENVIRONMENT?.trim();

if (!SALABLE_PUBLISHABLE_KEY) throw new Error('Missing SALABLE_PUBLISHABLE_KEY');
if (!SALABLE_LIVE_KEY) throw new Error('Missing SALABLE_LIVE_KEY');
if (!SALABLE_BASE_URL) throw new Error('Missing SALABLE_BASE_URL');
if (!CDN_DOMAIN) throw new Error('Missing CDN_DOMAIN');
if (!ENVIRONMENT) throw new Error('Missing ENVIRONMENT');

const CDNBase = !CDN_DOMAIN.startsWith('http') ? `https://${CDN_DOMAIN}` : CDN_DOMAIN;

export const environment = {
  publishableKey: SALABLE_PUBLISHABLE_KEY,
  liveKey: SALABLE_LIVE_KEY,
  baseURL: SALABLE_BASE_URL,
  baseCDN: CDNBase,
  assert: ENVIRONMENT === 'dev' ? '../../../dist' : `${CDNBase}/latest`,
};
