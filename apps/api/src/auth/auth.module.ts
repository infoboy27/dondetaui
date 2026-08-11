import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { UsersRepository } from './users.repository'

const jwtModule = JwtModule.registerAsync({
  useFactory: () => {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is required')
    }

    return { secret, signOptions: { expiresIn: '30d' } }
  },
})

@Module({
  imports: [jwtModule],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository, JwtAuthGuard],
  // Re-export jwtModule too: JwtAuthGuard is used via @UseGuards() in other
  // modules (alerts), and Nest resolves its JwtService dependency in THAT
  // module's own injector context — just exporting the guard class isn't
  // enough, the module providing its dependency has to be exported as well.
  exports: [JwtAuthGuard, jwtModule],
})
export class AuthModule {}
