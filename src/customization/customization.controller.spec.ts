import { Test, TestingModule } from '@nestjs/testing';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';

describe('CustomizationController', () => {
  let controller: CustomizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomizationController],
      providers: [CustomizationService],
    }).compile();

    controller = module.get<CustomizationController>(CustomizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
