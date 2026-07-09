const express = require("express");
require('dotenv').config();
const {verifyUserToken} = require('./jwt.js')
/**
 * Middleware
 */
const {validateJWT} = require('./middleware/tokenValidation.middleware.js');
/**
 * Controllers
 */
const { githubRedirect} = require("./controller/redirect.controller")
const {updatePubKey} = require('./controller/namespace.controller.js');
const {downloadRepo,publishAudit,getKey} = require("./controller/registry.controller.js")
/**
 * Schema
 */

 
const router = express.Router();


router.get('/test', (req,res)=>{
    res.json(
        {
            msg: "Test successful"

        }
    )
})

// // routes/auth.js
// router.post('/register', async (req, res) => {
//     // STUBBED FLOW:
//     // 1. Accept { namespace, publicKey } from CLI
//     // 2. Skip GitHub OAuth exchange for now (TODO: Implement Device Grant RFC 8628)
//     // 3. Save to namespaces collection with dummy ownerId and status: "ACTIVE"
// });

// // routes/manifests.js
// router.post('/publish', async (req, res) => {
//     // ACTION 2: Ingestion Integrity Audit
//     // 1. Fetch publicKey from DB using req.body.namespace
//     // 2. Run crypto.verify(req.body.manifestRawString, publicKey, req.body.signature)
//     // 3. If valid, save to manifests collection & push to BullMQ
// });

// router.get('/resolve/:namespace/:serverName', async (req, res) => {
//     // ACTION 4: Runtime Manifest Resolution
//     // 1. Query manifest using compound index on namespace + serverName
//     // 2. Ensure securityScan.status === "PASSED"
//     // 3. Use .lean() for maximum performance to return raw strings to client loader
// });

router.get('/getkey',
    getKey
)

router.post('/update/pubkey',
    validateJWT,
    updatePubKey
)

router.post("/download/project",
    validateJWT,
    downloadRepo);

router.post('/publish', async (req, res) => {
    const auth = req?.headers?.authorization || req?.headers?.Authorization;
    let tokenOutput;

    if(auth.startsWith('Bearer ')){
            const words = auth.split(' ');
            const token = words[1];
            tokenOutput = verifyUserToken(token);
    }

    if(!tokenOutput){
        res.status(401).json({ msg:tokenOutput.msg });
    }

    /**
     * Call controller for further processing.
     */
    console.log(req.body);

    res.status(200).json({ msg: "Reached end point!" });
});

router.get('/resolve/:namespace/:serverName', async (req, res) => {
    res.status(501).json({ msg: "Not implemented" });
});

router.get('/oauth/github',
    githubRedirect
)
router.get('/oauth/success',(req,res)=>{
    res.status(200);
    res.json({msg : "Auth success"});
})


module.exports = router;