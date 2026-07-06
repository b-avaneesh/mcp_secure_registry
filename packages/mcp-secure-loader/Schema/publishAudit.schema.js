import mongoose from "mongoose";

const PermissionsSchema = new mongoose.Schema(
    {
        network: {
            type: Boolean,
            default: false
        },

        filesystem: {
            type: Boolean,
            default: false
        },

        environment: {
            type: Boolean,
            default: false
        },

        subprocess: {
            type: Boolean,
            default: false
        }
    },
    { _id: false }
);

const RepositorySchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true
        },

        branch: {
            type: String,
            default: "main"
        }
    },
    { _id: false }
);

const PublishAuditSchema = new mongoose.Schema(
    {
        ownerId: {
            type: String,
            required: true,
            index: true
        },

        githubUsername: {
            type: String,
            required: true
        },

        namespace: {
            type: String,
            required: true,
            match: /^github\.[a-zA-Z0-9_-]+$/
        },

        packageName: {
            type: String,
            required: true,
            trim: true
        },

        version: {
            type: String,
            required: true
        },

        repository: {
            type: RepositorySchema,
            required: true
        },

        commitId: {
            type: String,
            required: true
        },

        manifest: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        manifestHash: {
            type: String,
            required: true
        },

        signature: {
            type: String,
            required: true
        },

        keyId: {
            type: String,
            required: true
        },

        permissions: {
            type: PermissionsSchema,
            default: () => ({})
        },

        publishStatus: {
            type: String,
            enum: ["SUCCESS", "FAILED", "REVOKED"],
            default: "SUCCESS"
        }
    },
    {
        timestamps: true
    }
);

PublishAuditSchema.index(
    {
        namespace: 1,
        packageName: 1,
        version: 1
    },
    {
        unique: true
    }
);

PublishAuditSchema.index({ commitId: 1 });

export default mongoose.model(
    "publish_audit_collection",
    PublishAuditSchema
);