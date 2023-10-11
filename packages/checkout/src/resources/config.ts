const SALABLE_PUBLISHABLE_KEY = process.env.SALABLE_PUBLISHABLE_KEY?.trim();
const SALABLE_LIVE_KEY = process.env.SALABLE_LIVE_KEY?.trim();
const SALABLE_BASE_URL = process.env.SALABLE_BASE_URL?.trim();
const SALABLE_BASE_CDN = process.env.SALABLE_BASE_URL?.trim();
const ENVIRONMENT = process.env.ENVIRONMENT?.trim();

if (!SALABLE_PUBLISHABLE_KEY) throw new Error('Missing SALABLE_PUBLISHABLE_KEY');
if (!SALABLE_LIVE_KEY) throw new Error('Missing SALABLE_LIVE_KEY');
if (!SALABLE_BASE_URL) throw new Error('Missing SALABLE_BASE_URL');
if (!SALABLE_BASE_CDN) throw new Error('Missing SALABLE_BASE_CDN');
if (!ENVIRONMENT) throw new Error('Missing ENVIRONMENT');

// eslint-disable-next-line prettier/prettier, no-console
console.log('PRO B <->', SALABLE_BASE_URL);
// eslint-disable-next-line prettier/prettier, no-console
console.log('PRO B <->', SALABLE_BASE_CDN);

export const environment = {
  publishableKey: SALABLE_PUBLISHABLE_KEY,
  liveKey: SALABLE_LIVE_KEY,
  baseURL: SALABLE_BASE_URL,
  baseCDN: SALABLE_BASE_CDN,
  assert: ENVIRONMENT === 'dev' ? '../../../dist' : SALABLE_BASE_CDN,
};
