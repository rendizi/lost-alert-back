import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './api/auth/auth.module';
import { UserModule } from './api/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [AuthModule, UserModule,
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongo:QuGTKolqfIlllTpUCRAczfKltUEarSBK@autorack.proxy.rlwy.net:40438'), // Replace with your MongoDB URI
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
