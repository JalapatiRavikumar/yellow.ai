import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete (ret as any).__v;
                return ret;
            }
        },
        toObject: {
            virtuals: true
        }
    }
);

// Index for faster email lookups
userSchema.index({ email: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
