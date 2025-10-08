
const jwt = require('jsonwebtoken');
const secretKey = 'bidgrid277833';
const users = require('../models/Users')

const verifyToken = async (req, res, next) => {
    const token = req.header('authorization');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        const user = await users.findOne({
            where: {
                id: decoded.id
            }
        })

        if(user.isactive != 1){
            return res.status(401).json({
                message: 'Access Denied!'
            })
        }
        req.userId = decoded.id;
        req.emp_role = decoded.emp_role;
        next();
    } catch (err) {
        console.log(err.message)
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = verifyToken;

