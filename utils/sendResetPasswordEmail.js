const sendEmail = require('./sendEmail')

const sendResetPasswordEmail = async ({name, email, verificationToken}) => {
  
    const message = `<p>In order to reset your password, please enter the following 6-digit code in the application within 10 minutes:</p>
    <h2>${verificationToken}</h2>
    `
    return sendEmail({to: email, subject: "Reset Password", html: `<h4>Hello ${name}</h4>
    ${message}
    `})
}

module.exports = sendResetPasswordEmail