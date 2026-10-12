// `pnpm dev:prod-data`: the Vite dev server with the real production catalog,
// proxied through /api (see server.proxy in vite.config.ts). Read-only use:
// logging in here acts on real production accounts.
import { spawn } from 'node:child_process'

const target = process.env.DEV_API_PROXY || 'https://dondeta.com.do'
const env = { ...process.env, DEV_API_PROXY: target, VITE_USE_API: 'true', VITE_API_BASE_URL: '/api' }
console.log(`Proxying /api to ${target}`)
const child = spawn('pnpm', ['exec', 'vite', '--host', '0.0.0.0', ...process.argv.slice(2)], { env, stdio: 'inherit', shell: process.platform === 'win32' })
child.on('exit', code => process.exit(code ?? 0))
