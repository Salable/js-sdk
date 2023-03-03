import typescript from 'rollup-plugin-typescript2';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import cleaner from 'rollup-plugin-cleaner';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import dotenv from 'dotenv';
import copy from 'rollup-plugin-copy';
import packageJson from './package.json' assert {type: 'json'};

dotenv.config();

const config = {
  input: './src/index.ts',
  output: [
    {
      file: packageJson.main,
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
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        exclude: ['cdn/**', 'docs/**'],
      },
    }),
    copy({
      targets: [
        {src: 'src/pricing-table/src/css', dest: 'dist'},
        {src: 'src/pricing-table/src/lottie', dest: 'dist'},
      ],
    }),
  ],
};

export default config;
