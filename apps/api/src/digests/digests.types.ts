import { IsString, Length } from 'class-validator'

export class UnsubscribeDto {
  @IsString()
  @Length(48, 48)
  token!: string
}
