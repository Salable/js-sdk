import * as dotenv from 'dotenv';

dotenv.config();

const SALABLE_PUBLISHABLE_KEY = process.env.SALABLE_PUBLISHABLE_KEY?.trim();

if (!SALABLE_PUBLISHABLE_KEY) throw new Error('Missing SALABLE_PUBLISHABLE_KEY');

export const environment = {
  publishableKey: SALABLE_PUBLISHABLE_KEY,
};
