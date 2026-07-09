


const namespace = require("../Schema/namespaces.schema");
const async_handler = require("express-async-handler");
const {validateJWT} = require("../middleware/tokenValidation.middleware.js");

require("dotenv").config();



const updatePubKey = async_handler(async (req, res) => {
    try{
    /**
     * data has 
     *  userEmail: userEmail,
        id: userId,
        authTimestamp: Date.now()
     */
    const { data } = req.user;
    const { publicKey } = req.body;

    await namespace.findOneAndUpdate(
        { email: data.userEmail },
        {
            $set: {
                publicKey: {
                    publicKey,
                    revoked: false,
                    createdAt: new Date()
                }
            }
        },
        { new: true }
    );

    /**
     * (Dev - Debugging)
     */

    res.status(200).json({
        msg: "Updated pubkey successfully!"
    });

    }catch(err){
        console.error('OAuth Error:', err);
        res.status(500).send('Authentication failed');
    }

});

module.exports = { updatePubKey };
