import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        unique: [true,'Project name must be unique'],
    },
    users:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
                required: true,
            },
            message: { // Fix field name to `message` instead of `messages`
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
                expires: 172800, // 2 days in seconds
            },
        },
    ],
    fileTree: {
        type: Object,
        default: {},
    }
});

const Project = mongoose.model("project", projectSchema);

export default Project;