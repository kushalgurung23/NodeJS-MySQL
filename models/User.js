const db = require('../config/db')
const getCurrentDateTime = require('../utils/current_date_time')

class User {
    constructor({name, email, password, role, verificationToken}) {
        this.name = name,
        this.email = email,
        this.password = password,
        this.role = role,
        this.verificationToken = verificationToken
    }

    async save() {
        const dateTime = getCurrentDateTime()
        const sql = `INSERT INTO users(
            name,
            email, 
            password,
            role,
            verification_token,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`
        await db.execute(sql, [this.name, this.email, this.password, this.role, this.verificationToken, dateTime, dateTime]
        )
    }

    static async findUserById({userId}) {
        const sql = `SELECT * FROM users WHERE id = ?`
        const [user, _] = await db.execute(sql, [userId])
        return user[0]
    }

    static async findUserByEmail({email}) {
        const sql = `SELECT * FROM users WHERE email = ?`
        const [user, _] = await db.execute(sql, [email])
        return user[0]
    }

    // after correct 6 digit is entered by user
    static async confirmEmailVerification({email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set verification_token = ?, is_verified = ?, verified_on = ?, updated_at = ? WHERE email = ?
        `
        await db.execute(sql, [null, true, dateTime, dateTime, email])
    }

    // if user wants another verification token for registration
    static async updateVerificationToken({newToken, email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set verification_token = ?, updated_at = ? WHERE email = ?
        `
        await db.execute(sql, [newToken, dateTime, email])
    }

    // if user has forgotten the password
    static async updateForgotPasswordToken({passwordForgotToken, passwordForgotTokenExpirationDate, email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set password_forgot_token = ?, password_forgot_token_expiration_date = ?, is_password_forgot_token_verified = ?, updated_at = ? WHERE email = ?
        `
        await db.execute(sql, [passwordForgotToken, passwordForgotTokenExpirationDate, false, dateTime, email])
    }

    // WHEN USER PROVIDES CORRECT 6 DIGIT PASSWORD FORGOT CODE
    static async verifyForgotPasswordToken({email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set is_password_forgot_token_verified = ?, updated_at = ? WHERE email = ?
        `
        await db.execute(sql, [true, dateTime, email])
    }

    // if user has successfully provided new password
    static async resetPassword({hashPassword, email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set password = ?, password_forgot_token = ?, password_forgot_token_expiration_date = ?, is_password_forgot_token_verified = ?, updated_at = ? WHERE email = ?
        `
        await db.execute(sql, [hashPassword, null, null, null, dateTime, email])
    }
}

module.exports = User