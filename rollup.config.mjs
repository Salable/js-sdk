import typescript from 'rollup-plugin-typescript2';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import cleaner from 'rollup-plugin-cleaner';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from 'rollup-plugin-json';
import dotenv from 'dotenv';
import packageJson from './package.json' assert { type: 'json' };
import copy from 'rollup-plugin-copy';

dotenv.config();

const config = {
  input: './packages/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    json(),
    peerDepsExternal(),
    cleaner({
      targets: ['./dist'],
    }),
    resolve({
      moduleDirectories: ['packages'],
    }),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        exclude: ['cdn/**'],
      },
    }),
    copy({
      targets: [
        { src: 'packages/pricing-table/src/css', dest: 'dist' },
        { src: 'packages/pricing-table/src/lottie', dest: 'dist' },
      ],
    }),
  ],
};

export default config;
