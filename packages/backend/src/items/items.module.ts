import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [ItemsController],
    providers: [ItemsService],
})
export class ItemsModule { }
