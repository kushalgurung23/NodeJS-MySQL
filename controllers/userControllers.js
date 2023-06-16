const User = require('../models/User')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')
const {uploadImage} = require('../utils')

const editProfilePicture = async (req, res) => {
    const {userId} = req.user
    console.log(userId);
    const imagePath = await uploadImage(req, res)
    if(!imagePath) {
        throw new CustomError.BadRequestError('Unable to update profile picture.')
    }
    await User.editProfilePicture({profilePicture: imagePath, userId})
    res.status(StatusCodes.OK).json({status: "Success", image: imagePath, msg: "Profile picture updated successfully."})
}

const editUserDetails = async (req, res) => {
    const {userId} = req.user

    if(Object.keys(req.body).length === 0) {
        throw new CustomError.BadRequestError('User details cannot be empty.')
    }

    const user = await User.findUserById({userId})
    if(!user) {
        throw new CustomError.NotFoundError('This user does not exist.')
    }
    await User.editUserDetails({toBeUpdatedFields: req.body, userId})
    res.json({status: "Success", msg: "User details updated successfully."})
}

const getMyDetails = async (req, res) => {
    const {userId} = req.user
    const user = await User.getMyDetails({userId: userId})
    if(!user) {
        throw new CustomError.NotFoundError('User not found.')
    }
    res.json({status: "Success", user})
}

module.exports = {
    editProfilePicture,
    editUserDetails,
    getMyDetails
}