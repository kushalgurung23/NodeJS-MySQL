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

    static async findUserByEmail({email}) {
        const sql = `SELECT * FROM users WHERE email = ?`
        const [user, _] = await db.execute(sql, [email])
        return user[0]
    }
}

module.exports = User