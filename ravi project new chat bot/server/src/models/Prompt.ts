import mongoose, { Document, Schema } from 'mongoose';

export interface IPrompt extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    content: string;
    projectId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const promptSchema = new Schema<IPrompt>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
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

// Index for faster project lookups
promptSchema.index({ projectId: 1 });

const Prompt = mongoose.model<IPrompt>('Prompt', promptSchema);

export default Prompt;
