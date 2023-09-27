import typescript from 'rollup-plugin-typescript2';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import cleaner from 'rollup-plugin-cleaner';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from 'rollup-plugin-json';
import dotenv from 'dotenv';
import packageJson from './package.json' assert { type: 'json' };
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';

dotenv.config();

const config = {
  input: './packages/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: ['@stripe/stripe-js', 'crypto-js'],
  plugins: [
    json(),
    peerDepsExternal(),
    cleaner({
      targets: ['./dist'],
    }),
    replace({
      preventAssignment: true,
      'process.env.SALABLE_PUBLISHABLE_KEY': `"${process.env.SALABLE_PUBLISHABLE_KEY}"`,
      'process.env.SALABLE_LIVE_KEY': `"${process.env.SALABLE_LIVE_KEY}"`,
      'process.env.SALABLE_BASE_URL': `"${process.env.SALABLE_BASE_URL}"`,
      'process.env.SALABLE_BASE_CDN': `"${process.env.SALABLE_BASE_CDN}"`,
    }),
    resolve({
      moduleDirectories: ['packages'],
    }),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        exclude: ['cdn/**', 'docs/**'],
      },
    }),
    copy({
      targets: [
        { src: 'packages/pricing-table/src/css', dest: 'dist' },
        { src: 'packages/pricing-table/src/lottie', dest: 'dist' },
        { src: 'packages/checkout/src/css', dest: 'dist' },
      ],
    }),
  ],
};

export default config;
