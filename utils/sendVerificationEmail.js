const sendEmail = require('./sendEmail')

const sendVerificationEmail = async ({name, email, verificationToken}) => {
    const message = 
    `<p>Please confirm your email by entering the following 6-digit code in our application:</p>
    <h2>${verificationToken}</h2>
    `
    return sendEmail({
        to: email,
        subject: `Email Verification`,
        html: `<p>Hello, </p><h4>${name}</h4>
        ${message}
        `
    })
}

module.exports = sendVerificationEmail