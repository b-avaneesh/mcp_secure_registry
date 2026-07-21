const asyncHandler = require("express-async-handler");
const PublishAuditSchema = require("../Schema/publishAudit.schema");
const namespaceSchema = require("../Schema/namespaces.schema")

const publishAudit = asyncHandler(async (req, res) => {
    const data = req.user;

    const developer = await namespaceSchema.findOne({
        email: data.userEmail
    });

    if (!developer) {
        return res.status(404).json({
            message: "Developer not found"
        });
    }

    let {
        packageName,
        version,
        description,
        entry,
        repository,
        commitId,
        permissions,
        manifest,
        manifestHash,
        signature,
        security
    } = req.body;

    // Transform permissions array to object
    if (Array.isArray(permissions)) {
        permissions = {
            network: permissions.includes('network'),
            filesystem: permissions.includes('filesystem'),
            environment: permissions.includes('environment'),
            subprocess: permissions.includes('subprocess')
        };
    }

    const audit = await PublishAuditSchema.create({
        ownerId: developer.ownerId,
        githubUsername: developer.githubUsername,

        packageName,
        version,
        description,
        entry,

        repository,
        commitId,
        permissions,

        manifest,
        manifestHash,
        signature,

        security,

        publishStatus: "SUCCESS"
    });

    console.dir(audit, { depth: null });

    res.status(201).json({
        message: "Publish audit stored successfully.",
        auditId: audit._id
    });
});

const downloadRepo = asyncHandler(async (req, res) => {

    const { githubUsername, packageName, version } = req.body;

    const repo = await PublishAuditSchema.findOne({
        githubUsername,
        packageName,
        version
    }).select("-_id -__v");

    if (!repo) {
        return res.status(404).json({
            message: "Package not found."
        });
    }

    console.log(repo);

    res.status(201).json( repo );
});

const getKey = asyncHandler(async (req, res) => {
    const { githubUsername } = req.body;

    const developer = await namespaceSchema.findOne({
        githubUsername
    });

    if (!developer) {
        return res.status(404).json({
            message: "Developer not found"
        });
    }

    const { publicKey } = developer;

    res.status(201).json(publicKey);
});

module.exports = {
    publishAudit,
    downloadRepo,
    getKey
};