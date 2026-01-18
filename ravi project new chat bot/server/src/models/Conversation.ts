import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    projectId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        title: {
            type: String,
            default: 'New Conversation'
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
conversationSchema.index({ projectId: 1 });

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
