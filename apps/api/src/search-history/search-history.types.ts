import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RecordSearchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  query!: string
}
