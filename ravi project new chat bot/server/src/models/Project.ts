import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    systemPrompt: string;
    aiModel: string;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: null
        },
        systemPrompt: {
            type: String,
            default: 'You are a helpful AI assistant.'
        },
        aiModel: {
            type: String,
            default: 'openai/gpt-3.5-turbo'
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
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

// Index for faster user lookups
projectSchema.index({ userId: 1 });

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
