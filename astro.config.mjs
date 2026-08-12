import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import './src/config'; // Side-effect import to validate config shape at build time

export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'middleware', bodySizeLimit: 5 * 1024 * 1024 * 1024 }),
	devToolbar: { enabled: false }
});
