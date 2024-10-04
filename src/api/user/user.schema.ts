import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true, unique: true })
    phoneNumber: string;
    
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, default: 10 })
    xp: number;

    @Prop({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: false,
        },
    })
    lastLocation: {
        type: string;
        coordinates: number[];
    };
}

export const UserSchema = SchemaFactory.createForClass(User);
