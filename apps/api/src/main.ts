import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: false,
  })
  app.setGlobalPrefix('api')

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port, '0.0.0.0')

  console.log(`DóndeTa API listening on http://0.0.0.0:${port}/api`)
}

void bootstrap()
