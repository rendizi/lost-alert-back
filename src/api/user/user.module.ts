import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./user.schema";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { CACHE_MANAGER, CacheModule } from "@nestjs/cache-manager";

@Module({
    imports: [
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        CacheModule.register()
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService, MongooseModule]
})

export class UserModule {}