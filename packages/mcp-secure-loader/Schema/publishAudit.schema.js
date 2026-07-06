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

const FindingSchema = new mongoose.Schema(
    {
        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            required: true
        },

        category: {
            type: String,
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        recommendation: {
            type: String,
            required: true
        },

        file: {
            type: String,
            required: true
        },

        line: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);

const SecuritySchema = new mongoose.Schema(
    {
        verdict: {
            type: String,
            enum: ["SAFE", "SUSPICIOUS", "MALICIOUS"],
            required: true
        },

        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            required: true
        },

        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            required: true
        },

        permissionsMatch: {
            type: Boolean,
            default: true
        },

        missingPermissions: {
            type: [{
                type: String,
                enum: ["network", "filesystem", "process", "env"]
            }],
            default: []
        },

        unnecessaryPermissions: {
            type: [{
                type: String,
                enum: ["network", "filesystem", "process", "env"]
            }],
            default: []
        },

        findings: {
            type: [FindingSchema],
            default: []
        }
    },
    { _id: false }
);

// const ScanSchema = new mongoose.Schema(
//     {
//         engineVersion: {
//             type: String,
//             required: true
//         },

//         llmModel: {
//             type: String,
//             required: true
//         },

//         scannedAt: {
//             type: Date,
//             default: Date.now
//         },

//         durationMs: {
//             type: Number,
//             required: true
//         }
//     },
//     { _id: false }
// );

const PublishAuditSchema = new mongoose.Schema(
    {
        // Publisher
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

        // Package
        packageName: {
            type: String,
            required: true,
            trim: true
        },

        version: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        entry: {
            type: String,
            required: true
        },

        repository: {
            type: RepositorySchema,
            required: true
        },

        commitId: {
            type: String,
            required: true,
            index: true
        },

        permissions: {
            type: PermissionsSchema,
            default: () => ({})
        },

        // Manifest & Signature
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


        // Security Scan
        security: {
            type: SecuritySchema,
            required: true
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

PublishAuditSchema.index({
    "security.verdict": 1
});

PublishAuditSchema.index({
    "security.riskLevel": 1
});

PublishAuditSchema.index({
    "security.findings.severity": 1
});

export default mongoose.model(
    "publish_audit_collection",
    PublishAuditSchema
);