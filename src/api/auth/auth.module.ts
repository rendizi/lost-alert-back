import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../user/user.module";

@Module({
    imports: [
      JwtModule.register({
        secret: 'yourSecretKey', 
        signOptions: { expiresIn: '15m' },
      }),
      UserModule,
    ],
    providers: [AuthService, JwtStrategy, JwtAuthGuard],
    controllers: [AuthController],
    exports: [AuthService, JwtAuthGuard],
  })
  export class AuthModule {}
  