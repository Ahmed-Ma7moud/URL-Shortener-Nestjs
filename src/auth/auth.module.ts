import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserEntity } from '../user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    JwtModule,
  ],

  providers: [JwtStrategy, AuthService],

  controllers: [AuthController],

  exports: [PassportModule, AuthService],
})
export class AuthModule {}
