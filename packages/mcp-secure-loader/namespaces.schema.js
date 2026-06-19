// const mongoose = require("mongoose");

// const PermissionsSchema = new mongoose.Schema(
// {
// network: {
// type: Boolean,
// default: false
// },
// filesystem: {
// type: Boolean,
// default: false
// },
// environment: {
// type: Boolean,
// default: false
// },
// subprocess: {
// type: Boolean,
// default: false
// }
// },
// { _id: false }
// );

// const NamespaceSchema = new mongoose.Schema(
// {
// namespace: {
// type: String,
// required: true,
// unique: true,
// trim: true,
// match: /^github.[a-zA-Z0-9_-]+$/
// },

// ownerId: {
// type: String,
// required: true
// }, //github userId

// githubUsername: {
// type: String,
// required: true
// },

// email: {
// type: String,
// required: true
// },

// emailVerified: {
// type: Boolean,
// default: false
// },

// publicKey: {
// type: String,
// required: true
// },

// permissions: {
// type: PermissionsSchema,
// default: () => ({})
// },

// trustScore: {
// type: Number,
// default: 0
// },

// status: {
// type: String,
// enum: ["ACTIVE", "SUSPENDED", "REVOKED"],
// default: "ACTIVE"
// }
// },
// {
// timestamps: true
// }
// );

// NamespaceSchema.index({ ownerId: 1 });

// module.exports = mongoose.model(
// "namespace_collection",
// NamespaceSchema
// );

const mongoose = require("mongoose");

const PermissionsSchema = new mongoose.Schema(
    {
        network: { type: Boolean },
        filesystem: { type: Boolean },
        environment: { type: Boolean },
        subprocess: { type: Boolean }
    },
    { _id: false }
);

const NamespaceSchema = new mongoose.Schema(
    {
        namespace: {
            type: String,
            trim: true,
            match: /^github.[a-zA-Z0-9_-]+$/
        },

        ownerId: { type: String },

        githubUsername: { type: String },

        email: { type: String },

        emailVerified: { type: Boolean },

        publicKey: { type: String },

        permissions: { type: PermissionsSchema },

        trustScore: { type: Number },

        status: {
            type: String,
            enum: ["ACTIVE", "SUSPENDED", "REVOKED"]
        }
    },
    { timestamps: true }
);

NamespaceSchema.index({ ownerId: 1 });

module.exports = mongoose.model("namespace_collection", NamespaceSchema);