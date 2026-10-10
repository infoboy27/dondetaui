# Despliegue continuo (CD)

Cada push a `main` → `.github/workflows/deploy.yml` → verifica (typecheck, tests, build)
→ SSH a 163.245.207.38:1600 → `dondeta-deploy.sh deploy <sha>` en los 3 stacks
(`~/dondeta`, `~/dondeta-co`, `~/dondeta-mx`). Cada stack: `git reset --hard <sha>`,
`docker compose build && up -d` (migraciones incluidas), health check de `/healthz`,
`/api/health` y `/`; si falla, vuelve solo al commit anterior.

Manual desde GitHub: **Actions → Deploy → Run workflow** → `status`, `rollback <stack>`,
`merge-products <stack>` (dry run, o real marcando *apply*).

## Instalación (una vez)

1. Servidor: copiar `dondeta-deploy.sh` a `~/dondeta-deploy/` y agregar a
   `~/.ssh/authorized_keys` la llave pública con
   `command="/home/ubuntu/dondeta-deploy/dondeta-deploy.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding`.
2. GitHub: secreto `DEPLOY_SSH_KEY` = llave privada.

Si cambias `dondeta-deploy.sh`, vuelve a copiarlo al servidor (el pipeline no se auto-actualiza
a propósito: la llave de Actions no debe poder reescribir su propio script).
