const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User')
const Token = require('../models/Token')
const crypto = require('crypto')
const {
    createHash, 
    sendVerificationEmail, 
    generateHashPassword, 
    compareHashPassword, 
    createTokenUser, 
    createJWT, 
    TokenType, 
    sendResetPasswordEmail
} = require('../utils')

const registerUser = async (req, res) => {

    const {email, name, password} = req.body
    // If user has not provided any input
    if(!name || !email || !password) {
        throw new CustomError.BadRequestError('Please provider all user details.')
    }
    const emailAlreadyExists = await User.findUserByEmail({email})
    if(emailAlreadyExists) {
        throw new CustomError.BadRequestError('Email already exists.')
    }
    // random six digits number
    const verificationToken = Math.floor(100000 + Math.random() * 900000);
    // while saving in db, we save the hashed verification code
    const hashToken = createHash(verificationToken)
    const hashPassword = await generateHashPassword({password})
    const user = new User({name, email, password: hashPassword, role: "user", verificationToken: hashToken})
    await user.save()
    // While sending token in email, we do not send the hashed token
    await sendVerificationEmail({
        name,
        email,
        verificationToken
    })
    res.status(StatusCodes.CREATED).json({status: 'Success', msg: 'User is created successfully.'})
}

const verifyEmail = async (req, res) => {
    const {verificationToken, email} = req.body;
    if(!verificationToken) {
        throw new CustomError.BadRequestError('Verification token is required.')
    }
    if(!email) {
        throw new CustomError.BadRequestError('Email is required.')
    }
    if(verificationToken.length !== 6) {
        throw new CustomError.BadRequestError('Invalid verification token')
    }
    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('Verification failed')
    }
    if(user.is_verified === 1 && user.verified_on !== null) {
        throw new CustomError.UnauthenticatedError(`User was already verified on ${user.verified_on}`)
    }
    // user.verification_token is already hashed
    // Therefore, verificationToken input from user is also hashed to check whether they match or not
    if(user.verification_token !== createHash(verificationToken)) {
        throw new CustomError.UnauthenticatedError('Verification failed')
    }
    await User.confirmEmailVerification({email})
    res.status(StatusCodes.OK).json({status: 'Success', msg: 'Email is verified successfully'})
}

const resendVerificationToken = async (req, res) => {
    const {email} = req.body;
    if(!email) {
        throw new CustomError.BadRequestError('Email is required.')
    }
    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('User does not exist.')
    }
    if(user.is_verified === 1 && user.verified_on !== null) {
        throw new CustomError.UnauthenticatedError(`User was already verified on ${user.verified_on}`)
    }
    // random six digits number
    const verificationToken = Math.floor(100000 + Math.random() * 900000);
    // while saving verificationToken in db, we will hash it
    const hashToken = createHash(verificationToken)
    await User.updateVerificationToken({email, newToken: hashToken})
    // While sending token in email, we do not send the hashed token
    await sendVerificationEmail({
        name: user.name,
        email: user.email,
        verificationToken
    })
    res.status(StatusCodes.CREATED).json({status: 'Success', msg: 'New verification token is sent successfully.'})
}

const login = async (req, res) => {
    const {email, password} = req.body
    if (!email || !password) {
        throw new CustomError.BadRequestError('Please provide email and password');
    }
    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('User does not exist.')
    }
    const isPasswordCorrect = await compareHashPassword({userInputPassword: password, realPassword: user.password})
    if(!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials.')
    }
    if(!user.is_verified) {
        throw new CustomError.UnauthenticatedError('Please verify your email.')
    }
    const tokenUser = createTokenUser({name: user.name, userId: user.id, role: user.role})
    
    // USER REFRESH TOKEN iS STORED IN DATABASE
    // IT WILL BE USED TO GET NEW ACCESS TOKEN
    let userRefreshToken = '';

    // CHECK FOR EXISTING TOKEN
    const existingToken = await Token.findById({id: user.id})
   
    // If already created before (it means user has already logged in before)
    if(existingToken) {
        const {is_valid} = existingToken
        // USER will be unable to login when token is invalid, it can be done by admin
        if(!is_valid) {
            throw new CustomError.UnauthenticatedError('Invalid Credentials');
        }
        userRefreshToken = existingToken.refresh_token
        // GENERATE ACCESS JWT AND REFRESH JWT
        const accessJWT = createJWT({payload: tokenUser, tokenType: TokenType.ACCESSTOKEN})
        const refreshJWT = createJWT({payload: {tokenUser, userRefreshToken}, tokenType: TokenType.REFRESHTOKEN})
        res.status(StatusCodes.OK).json({user: tokenUser, accessToken: accessJWT, refreshToken: refreshJWT})
        return;
    }
   
    // if logging in for the first time
    userRefreshToken = crypto.randomBytes(40).toString('hex')
    const userToken = {refresh_token: userRefreshToken, user: user.id}
    await Token.createToken(userToken)
    // GENERATE ACCESS JWT AND REFRESH JWT
    const accessJWT = createJWT({payload: tokenUser, tokenType: TokenType.ACCESSTOKEN})
    const refreshJWT = createJWT({payload: {tokenUser, userRefreshToken}, tokenType: TokenType.REFRESHTOKEN})
    res.status(StatusCodes.OK).json({user: tokenUser, accessToken: accessJWT, refreshToken: refreshJWT})
}

const logout = async (req, res) => {
    console.log(req.user);
    await Token.deleteUserRefreshToken({userId: req.user.usedId})
    res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

const forgotPassword = async (req, res) => {
    const {email} = req.body
    if(!email) {
      throw new CustomError.BadRequestError('Please provide valid email')
    }

    const user = await User.findUserByEmail({email})
    if(user) {
    // random six digits number
    const verificationToken = Math.floor(100000 + Math.random() * 900000);
    // while sending email, we do not hash the verification token
      await sendResetPasswordEmail({
        name: user.name,
        email: user.email,
        verificationToken,
      })

        //   user will have to provide the token within ten minutes to be able to enter their new password
      const tenMinutes = 1000 * 60 * 10
      const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes)
  
      // hashing the forgot password verifiacation token before saving in db
      await User.updateForgotPasswordToken({
        passwordForgotToken: createHash(verificationToken),
        passwordForgotTokenExpirationDate: passwordTokenExpirationDate,
        email
      })
    }
    res.status(StatusCodes.OK).json({status: 'Success', msg: "Please check your email for reset password code"})
  }

  // IT WILL BE CALLED FROM FRONT-END, WHEN USER PROVIDES NEW PASSWORD
const resetPassword = async (req, res) => {
    // password is provided by user
    // token and email is received from query parameter when clicked on link from email
    const {password, token, email} = req.body
    if(!email || !password || !token) {
      throw new CustomError.BadRequestError('Please provide all values')
    }
    const user = await User.findUserByEmail({email})
    if(user) {
      
      // user.password_forgot_token is hashed already, so token received from user input is also hashed in order to check if both are equal
      if(user.password_forgot_token !== createHash(token)) {
        throw new CustomError.UnauthenticatedError('6 digit code does not match')
      }

      const currentDate = new Date()
      if(user.password_forgot_token_expiration_date < currentDate) {
        throw new CustomError.UnauthenticatedError('Password reset time period is over.')
      }
      const hashPassword = await generateHashPassword({password})
      await User.resetPassword({email, hashPassword})
    }
    // Even if there is no user, we will show successful message to avoid users from entering random email 
    res.status(StatusCodes.OK).json({msg: "Password is reset successfully"})
  }

module.exports = {
    registerUser,
    verifyEmail,
    resendVerificationToken,
    login,
    logout,
    forgotPassword,
    resetPassword
}