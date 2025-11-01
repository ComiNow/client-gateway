import { PaginationDto } from '../../common';
import { OrderStatus, OrderStatusList } from '../enum/order.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList}`,
  })
  status?: OrderStatus;
}
