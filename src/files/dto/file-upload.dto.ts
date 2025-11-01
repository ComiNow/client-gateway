import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

export class CategoryFileUploadDto {
  @ApiProperty({ type: 'string' })
  name: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  firstImage?: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  secondImage?: any;
}

export class FileResponseDto {
  fileName: string;
}
