#!/usr/bin/env node
// One-time consent so the /admin dashboard can read AdMob and AdSense earnings
// (both APIs refuse service accounts). Run on your own machine:
//
//   node apps/api/scripts/google-ads-oauth.mjs <oauth-client.json> [out.json]
//
// <oauth-client.json> is the "Desktop app" OAuth client downloaded from Google
// Cloud (APIs & Services > Credentials). It opens the browser, you sign in
// with the AdMob/AdSense owner account and press Allow, and it writes the
// client id/secret and refresh token to out.json (default
// ~/.config/dondeta/google-ads-oauth.json, mode 600). Nothing secret is
// printed. Copy the three values into the server .env as
// GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN.
import { createServer } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { execFile } from 'node:child_process'

const [clientPath, outPath = join(homedir(), '.config/dondeta/google-ads-oauth.json')] = process.argv.slice(2)
if (!clientPath) {
  console.error('Usage: node google-ads-oauth.mjs <oauth-client.json> [out.json]')
  process.exit(1)
}
const raw = JSON.parse(readFileSync(clientPath, 'utf8'))
const client = raw.installed ?? raw.web
if (!client?.client_id || !client?.client_secret) {
  console.error('That file is not an OAuth client (expected an "installed" Desktop app client).')
  process.exit(1)
}

const SCOPES = ['https://www.googleapis.com/auth/admob.report', 'https://www.googleapis.com/auth/adsense.readonly']
const verifier = randomBytes(32).toString('base64url')
const challenge = createHash('sha256').update(verifier).digest('base64url')
const state = randomBytes(16).toString('hex')

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1')
  if (url.pathname !== '/callback') { res.writeHead(404).end(); return }
  const finish = (status, message) => { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<p style="font:16px system-ui;padding:24px">${message}</p>`) }
  if (url.searchParams.get('state') !== state) return finish(400, 'Estado inválido. Vuelve a correr el script.')
  const code = url.searchParams.get('code')
  if (!code) { finish(400, `Google no autorizó: ${url.searchParams.get('error') ?? 'sin código'}`); server.close(); return }
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: client.client_id, client_secret: client.client_secret, redirect_uri: redirectUri, grant_type: 'authorization_code', code_verifier: verifier }),
  })
  const json = await response.json()
  if (!json.refresh_token) {
    finish(500, 'Google no devolvió un refresh token. Revisa la terminal.')
    console.error('Token exchange failed:', json.error, json.error_description ?? '')
    server.close()
    return
  }
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: json.refresh_token, scope: json.scope }, null, 2) + '\n', { mode: 0o600 })
  finish(200, '✅ Listo. Ya puedes cerrar esta pestaña y volver a la terminal.')
  console.log(`Saved to ${outPath} (scopes: ${json.scope})`)
  server.close()
})

let redirectUri = ''
server.listen(0, '127.0.0.1', () => {
  redirectUri = `http://127.0.0.1:${server.address().port}/callback`
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  auth.search = new URLSearchParams({
    client_id: client.client_id, redirect_uri: redirectUri, response_type: 'code', scope: SCOPES.join(' '),
    access_type: 'offline', prompt: 'consent', state, code_challenge: challenge, code_challenge_method: 'S256',
  }).toString()
  console.log('Opening the browser for Google consent…')
  execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [auth.toString()], () => {})
})
