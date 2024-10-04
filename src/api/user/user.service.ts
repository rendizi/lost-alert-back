import { ConflictException, HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { Model } from 'mongoose';
import { Twilio } from "twilio";
import * as bcrypt from 'bcrypt';
import axios from "axios";

@Injectable()
export class UserService {
    private readonly twilioClient: Twilio;
    private verificationCodes: { [key: string]: { code: string; expiry: number } } = {}; // In-memory store

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) {
        this.twilioClient = new Twilio('', '');
    }

    async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
        try {
            const phoneInfo = await this.twilioClient.lookups.phoneNumbers(phoneNumber).fetch({ type: ['carrier'] });
            return phoneInfo.carrier && phoneInfo.carrier.type !== 'unknown';
        } catch (error) {
            console.error('Error validating phone number:', error);
            return false;
        }
    }

    async findByPhone(phoneNumber: string) {
        return await this.userModel.findOne({ phoneNumber });
    }

    async sendCode(phoneNumber: string) {
        const existing = await this.userModel.findOne({ phoneNumber });
        if (existing) {
            throw new ConflictException('User with this phone number already exists');
        }

        if (this.verificationCodes[phoneNumber]) {
            throw new ConflictException('A verification code has already been sent to this phone number. Please wait before requesting a new code.');
        }

        const code = this.generateCode();
        console.log(`Generated code for ${phoneNumber}: ${code}`);

        await this.twilioClient.messages.create({
            from: '+12088377087',
            to: phoneNumber,
            body: `Your code is: ${code}`
        }).then(message => console.log(message.sid))
          .catch(err => console.error('Twilio error:', err));

        this.verificationCodes[phoneNumber] = {
            code,
            expiry: Date.now() + 1800000 // 30 minutes
        };
        console.log(`Cached code for ${phoneNumber} successfully.`);
    }

    async validateCode(phoneNumber: string, code: string): Promise<boolean> {
        console.log('Validating code...');
        console.log('Phone Number:', phoneNumber);

        const cachedData = this.verificationCodes[phoneNumber];
        if (!cachedData || Date.now() > cachedData.expiry) {
            throw new ConflictException('Try again');
        }

        console.log('Cached Code:', cachedData.code);
        console.log('Code provided:', code);

        return code === cachedData.code;
    }

    async createUser(phoneNumber: string, name: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new this.userModel({ phoneNumber, name, password: hashedPassword });
        return await newUser.save();
    }

    async getUserProfile(phoneNumber: string) {
        return await this.userModel.findOne({ phoneNumber });
    }

    async saveLocation(userId: string, latitude: number, longitude: number) {
        const location = {
            type: 'Point',
            coordinates: [longitude, latitude] // Note the order: [longitude, latitude]
        };

        return await this.userModel.findOneAndUpdate(
            { _id: userId },
            { lastLocation: location },
            { new: true } // Returns the updated document
        );
    }

    generateCode(): string {
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += Math.floor(Math.random() * 10);
        }
        return code;
    }

    async getCurrentLocation(ipAddress: string): Promise<any> {
        try {
            const response = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=af5867b92b7f4a26b8c4d39bf24e9d07&ip=${ipAddress}`)

            return response.data; // Adjust according to the response structure
        } catch (error) {
            console.error(error)
            throw new HttpException('Could not retrieve location', 500);
        }
    }

    async sendAnnouncement(body: string, long: number, lat: number){
        const users = await this.userModel.find({})
        for (const user of users){
            const sendToUser = async() => {
                await this.twilioClient.messages.create({
                    from: '+12088377087',
                    to: user.phoneNumber,
                    body
                }).catch(err => console.error('Twilio error:', err));
            }

            sendToUser()
        }
    }

    async findUsersNearby(latitude: number, longitude: number, maxDistance: number) {
        const users = await this.userModel.find({
            lastLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude] // Again, [longitude, latitude]
                    },
                    $maxDistance: maxDistance // Distance in meters
                }
            }
        }).exec();
    
        return users;
    }
    
}
