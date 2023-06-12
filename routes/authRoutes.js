const express = require('express')
const router = express.Router()

const { 
    registerUser, 
    verifyEmail, 
    resendVerificationToken,
    login,
    forgotPassword,
    resetPassword
} = require('../controllers/authControllers')

router.route('/register').post(registerUser)
router.route('/verify-email').post(verifyEmail)
router.route('/resend-verification-token').post(resendVerificationToken)
router.route('/login').post(login)
router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password').post(resetPassword)

module.exports = router