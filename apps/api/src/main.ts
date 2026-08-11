import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
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

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port, '0.0.0.0')

  console.log(`DóndeTa API listening on http://0.0.0.0:${port}/api`)
}

void bootstrap()
