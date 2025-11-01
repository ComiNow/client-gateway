import { SetMetadata } from '@nestjs/common';

export const SkipBusinessCheck = () => SetMetadata('skipBusinessCheck', true);
