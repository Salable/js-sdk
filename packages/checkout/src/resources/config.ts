// import * as dotenv from 'dotenv';

// dotenv.config();

// const SALABLE_PUBLISHABLE_KEY =
//   process.env.SALABLE_PUBLISHABLE_KEY?.trim() ||
//   'pk_test_51M1oo0Ku6oAVKC6A5cXnsTcvd7uEhvZcHlOp9RipUPxXLputaEA0FaTeqonlRILOSCUJpOdlZkx62Kibx1b21IZ700fb3fIPHp';
const SALABLE_PUBLISHABLE_KEY =
  'pk_test_51M1oo0Ku6oAVKC6A5cXnsTcvd7uEhvZcHlOp9RipUPxXLputaEA0FaTeqonlRILOSCUJpOdlZkx62Kibx1b21IZ700fb3fIPHp';

if (!SALABLE_PUBLISHABLE_KEY) throw new Error('Missing SALABLE_PUBLISHABLE_KEY');

export const environment = {
  publishableKey: SALABLE_PUBLISHABLE_KEY,
};
