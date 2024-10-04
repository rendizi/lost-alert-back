import { Body, Controller, Get, Param, Post, Put, Query, Req, Request, UnauthorizedException } from "@nestjs/common";
import { UserService } from "./user.service";
import * as jwt from 'jsonwebtoken';

@Controller('user')
export class UserController {
    private readonly jwtSecret: string = "few";

    constructor(private readonly userService: UserService) {}

    @Post("verify")
    async verifyPhoneNumber(
        @Body() { phoneNumber }: { phoneNumber: string }
    ) {
        try {
            await this.userService.sendCode(phoneNumber);
            const token = jwt.sign({ phoneNumber: phoneNumber, verified: false }, this.jwtSecret, { expiresIn: '3m' });
            return { message: "Code has been sent", token };
        } catch (error) {
            // Handle specific errors if needed
            throw new UnauthorizedException('Failed to send verification code');
        }
    }

    @Post("verify/code")
    async verifyCode(
        @Body() { code, phoneNumber }: { code: string, phoneNumber: string }
    ) {
        try {
            const status = await this.userService.validateCode(phoneNumber, code);
            const token = jwt.sign({ phoneNumber: phoneNumber, verified: true }, this.jwtSecret, { expiresIn: '10m' });
            return { status, token };
        } catch (error) {
            // Handle specific errors if needed
            throw new UnauthorizedException('Invalid verification code');
        }
    }

    @Post("signup")
    async signup(
        @Body() { name, password }: { name: string, password: string },
        @Query("token") token: string
    ) {
        let payload;

        try {
            payload = jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const phoneNumber = payload.phoneNumber;

        try {
            const user = await this.userService.createUser(phoneNumber, name, password);
            return { message: "User created successfully", user };
        } catch (error) {
            // Handle specific errors if needed
            throw new UnauthorizedException('Failed to create user');
        }
    }

    @Get('current-location')
    async getCurrentLocation(@Request() req: any) {
        const ipAddress = req.ip; 
        const location = await this.userService.getCurrentLocation(ipAddress);
        return { location };
    }

    @Post('location/:userId')
    async saveUserLocation(
        @Param('userId') userId: string,
        @Body() { latitude, longitude }: { latitude: number; longitude: number }
    ) {
        const updatedUser = await this.userService.saveLocation(userId, latitude, longitude) 
        const users = await this.userService.findUsersNearby(latitude, longitude, 1000);
        return { message: 'Nearby users found', users };
    }

    @Get('data/:phoneNumber')
    async getUserData(
        @Param("phoneNumber") phoneNumber: string 
    ){
        const user = await this.userService.findByPhone(phoneNumber)
        return user 
    }

    @Post("announcement") 
    async sendAnnouncement(
        @Body() { body }: { body: string },
     ) {
        await this.userService.sendAnnouncement(body,0,0);
        return { message: 'success' };
    }
}
