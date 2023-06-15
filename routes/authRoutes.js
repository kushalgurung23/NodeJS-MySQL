const express = require('express')
const router = express.Router()

const { 
    registerUser, 
    verifyEmail, 
    resendVerificationToken,
    login,
    forgotPassword,
    checkPasswordForgotToken,
    resetPassword,
    logout,
    generateNewAccessToken
} = require('../controllers/authControllers')
const {refreshTokenVerification, logoutRefreshTokenVerification} = require('../middlewares/authentication')

router.route('/register').post(registerUser)
router.route('/verify-email').post(verifyEmail)
router.route('/resend-verification-token').post(resendVerificationToken)
router.route('/login').post(login)
router.route('/forgot-password').post(forgotPassword)
router.route('/check-password-forgot-token').post(checkPasswordForgotToken)
router.route('/reset-password').post(resetPassword)
router.route('/logout').delete(logoutRefreshTokenVerification, logout)
router.route('/generate-new-access-token').post(refreshTokenVerification, generateNewAccessToken)

module.exports = router