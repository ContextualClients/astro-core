import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';

import './src/config'; // Side-effect import to validate config shape at build time

export default defineConfig({
	output: 'server',
	adapter: node({ mode: process.env.DEPLOYMENT === 'WORKER' ? 'standalone' : 'middleware', bodySizeLimit: 5 * 1024 * 1024 * 1024 }),
	env: {
		schema: {
			DEPLOYMENT: envField.enum({ context: 'server', access: 'public', values: ['AGENT', 'WORKER'], default: 'AGENT' }),
		},
	},
	devToolbar: { enabled: false }
});
