import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GuardiaSesion } from './sesion';

// Global para que cualquier módulo pueda usar @UseGuards(GuardiaSesion) sin importar nada más.
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: (process.env.JWT_EXPIRA ?? '8h') as `${number}h` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GuardiaSesion],
  exports: [JwtModule, GuardiaSesion],
})
export class AuthModule {}
