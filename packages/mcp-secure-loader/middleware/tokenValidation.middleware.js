
const  { verifyUserToken } = require("../jwt.js");

const validateJWT = async (req,res,next)=> {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            msg: "Token missing"
        });
    }

    const token = authHeader.split(" ")[1];
    const {success, data } = verifyUserToken(token);
    if(!success){
        res.status(401).json({
            msg: data
        })
        return;
    }
    req.user = data;

    next()
}

module.exports = {validateJWT};