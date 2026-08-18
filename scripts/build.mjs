import { build } from 'vite';
import { createViteRuntimeConfig } from './vite-runtime.mjs';

await build(createViteRuntimeConfig());
console.log('Vite build completed successfully');
