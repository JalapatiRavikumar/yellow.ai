import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    _id: mongoose.Types.ObjectId;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    projectId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const fileSchema = new Schema<IFile>(
    {
        filename: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
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

// Index for faster project lookups
fileSchema.index({ projectId: 1 });

const File = mongoose.model<IFile>('File', fileSchema);

export default File;
