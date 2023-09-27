const SALABLE_PUBLISHABLE_KEY = process.env.SALABLE_PUBLISHABLE_KEY?.trim();
const SALABLE_LIVE_KEY = process.env.SALABLE_LIVE_KEY?.trim();

if (!SALABLE_PUBLISHABLE_KEY) throw new Error('Missing SALABLE_PUBLISHABLE_KEY');
if (!SALABLE_LIVE_KEY) throw new Error('Missing SALABLE_LIVE_KEY');

export const environment = {
  publishableKey: SALABLE_PUBLISHABLE_KEY,
  liveKey: SALABLE_LIVE_KEY,
};
