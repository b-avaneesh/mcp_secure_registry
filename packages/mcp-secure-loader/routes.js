const express = require("express");
require('dotenv').config();


const router = express.Router();


router.get('/test', (req,res)=>{
    res.json(
        {
            msg: "Test successful"

        }
    )
})

// routes/auth.js
router.post('/register', async (req, res) => {
    // STUBBED FLOW:
    // 1. Accept { namespace, publicKey } from CLI
    // 2. Skip GitHub OAuth exchange for now (TODO: Implement Device Grant RFC 8628)
    // 3. Save to namespaces collection with dummy ownerId and status: "ACTIVE"
});

// routes/manifests.js
router.post('/publish', async (req, res) => {
    // ACTION 2: Ingestion Integrity Audit
    // 1. Fetch publicKey from DB using req.body.namespace
    // 2. Run crypto.verify(req.body.manifestRawString, publicKey, req.body.signature)
    // 3. If valid, save to manifests collection & push to BullMQ
});

router.get('/resolve/:namespace/:serverName', async (req, res) => {
    // ACTION 4: Runtime Manifest Resolution
    // 1. Query manifest using compound index on namespace + serverName
    // 2. Ensure securityScan.status === "PASSED"
    // 3. Use .lean() for maximum performance to return raw strings to client loader
});

module.exports = router;