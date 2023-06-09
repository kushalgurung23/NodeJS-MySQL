const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User')
const {createHash} = require('../utils')

const registerUser = async (req, res) => {
    const {email, name, password} = req.body
    const emailAlreadyExists = await User.findUserByEmail({email})
    if(emailAlreadyExists) {
        throw new CustomError.BadRequestError('Email already exists.')
    }
    // random six digits number
    const verificationToken = Math.floor(100000 + Math.random() * 900000);
    // verificationToken will also be hashed in verifyEmail controller which is returned from query string. 
    const hashToken = createHash(verificationToken.toString())
    const user = new User({name, email, password, role: "user", verificationToken: hashToken})
    await user.save()
    res.status(StatusCodes.CREATED).json({status: 'Success', verificationToken, msg: 'User is created successfully.'})
}

module.exports = {
    registerUser
}