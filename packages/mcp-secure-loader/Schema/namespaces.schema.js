const mongoose = require("mongoose");

const PublicKeySchema = new mongoose.Schema(
    {
        keyId: {
            type: String,
            required: true
        },

        publicKey: {
            type: String,
            required: true
        },

        revoked: {
            type: Boolean,
            default: false
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const DeveloperSchema = new mongoose.Schema(
    {
        ownerId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        githubUsername: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        emailVerified: {
            type: Boolean,
            default: false
        },

        namespaces: [
            {
                type: String,
                match: /^github\.[a-zA-Z0-9_-]+$/
            }
        ],

        publicKeys: {
            type: [PublicKeySchema],
            default: []
        },

        trustScore: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["ACTIVE", "SUSPENDED", "REVOKED"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "developer_collection",
    DeveloperSchema
);