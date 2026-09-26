import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from './decorators/public.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LoginDto } from './dto/login.dto';
import { IAuthUser } from './interfaces/auth.interface';
import { AuthUser } from './decorators/user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  async register(@Body() body: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(body);
  }

  @Post('verify-otp')
  @Public()
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; token: string }> {
    const { email, otp } = verifyOtpDto;
    return this.authService.verifyRegisterOtp(email, otp);
  }

  @Post('login')
  @Public()
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ message: string; token: string }> {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(
    @Body() forgotPasswordDto: ForgetPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    return this.authService.forgetPassword(email);
  }

  @Post('verify-reset-otp')
  @Public()
  async verifyResetOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; token: string }> {
    const { email, otp } = verifyOtpDto;
    return this.authService.verifyResetPasswordOtp(email, otp);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;
    return this.authService.resetPassword(token, newPassword);
  }
  
  @Post('logout')
  async logout(@AuthUser() user: IAuthUser): Promise<{ message: string }> {
    return this.authService.logout(user);
  }
}
