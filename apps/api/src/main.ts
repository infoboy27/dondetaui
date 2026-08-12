import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { AlertingExceptionFilter } from './common/alerting-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Requests arrive through two proxy hops in production (Traefik, then the
  // `web` container's nginx, see deploy/nginx.conf's /api/ location) --
  // without this, Express's req.ip (which @nestjs/throttler keys rate
  // limits on) sees nginx's container IP for every request, collapsing
  // the whole site's traffic into one shared rate-limit bucket instead of
  // one per real visitor. 2 is deliberately a specific hop count, not
  // `true` (trust everything) -- the API is only reachable through that
  // exact chain (127.0.0.1-bound / Docker-internal), so this can't be
  // spoofed by an outside client forging X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', 2)

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  // Fail closed in production: an unset CORS_ORIGINS must not silently
  // fall back to "allow any origin" on a real deployment.
  if (process.env.NODE_ENV === 'production' && origins.length === 0) {
    throw new Error('CORS_ORIGINS is required when NODE_ENV=production')
  }

  app.use(helmet())
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: false,
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  app.useGlobalFilters(new AlertingExceptionFilter())

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port, '0.0.0.0')

  console.log(`DóndeTa API listening on http://0.0.0.0:${port}/api`)
}

void bootstrap()
