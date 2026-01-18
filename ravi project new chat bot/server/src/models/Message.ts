import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    role: 'user' | 'assistant' | 'system';
    content: string;
    conversationId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
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

// Index for faster conversation lookups
messageSchema.index({ conversationId: 1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
