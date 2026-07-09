const asyncHandler = require("express-async-handler");
const PublishAudit = require("../Schema/publishAudit.schema");

/**
 * When to process versioning.
 * 
 * 2 paths:
 * (1) Allowing dev to provide version number.
 * (2) Writing a small logic for versioning - if no previous publishes for a given branch and rep - v1 else vi+1.
 * 
 * - problems with (2) - may not be able to differentiate bw feature and bug fix.
 */

const publishAudit = asyncHandler(async (req, res) => {
    const { data } = req.user;

    const developer = await namespace.findOne({
        email: data.userEmail
    });

    if (!developer) {
        return res.status(404).json({
            message: "Developer not found"
        });
    }

    const {
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

    /**
     * Need to process version
     */
    const audit = await PublishAudit.create({
        ownerId: developer.ownerId,
        githubUsername: developer.githubUsername,
        namespace: developer.namespace,

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

    console.log(audit);
    
    res.status(201).json({
        message: "Publish audit stored successfully.",
        auditId: audit._id
    });
});

const downloadRepo = asyncHandler(async (req, res) => {
    const { data } = req.user;

    const developer = await namespace.findOne({
        email: data.userEmail
    });

    if (!developer) {
        return res.status(404).json({
            message: "Developer not found"
        });
    }

    const {
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

    const repo = await PublishAudit.findOne({
        githubUsername: developer.githubUsername,
        packageName,
        version
    }).select("-_id -__v");

    if (!repo) {
    return res.status(404).json({
        message: "Package not found."
    });
    }
    console.log(repo);
    
    res.status(201).json({repo});
});
const getKey = asyncHandler(async (req, res) => {
    const { githubUsername } = req.user;

    const developer = await namespace.findOne({
        githubUsername
    });


    if (!developer) {
        return res.status(404).json({
            message: "Developer not found"
        });
    }

    const { publicKey } = developer;
    
    res.status(201).json({ publicKey });
});

module.exports = {
    publishAudit,
    downloadRepo,
    getKey
};