import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class RegisterPushTokenDto {
  @IsString()
  @MaxLength(200)
  @Matches(/^Expo(nent)?PushToken\[[^\]]+\]$/, { message: 'token must be an Expo push token' })
  token!: string

  @IsOptional()
  @IsIn(['android', 'ios'])
  platform?: string
}

export class UnregisterPushTokenDto {
  @IsString()
  @MaxLength(200)
  token!: string
}
