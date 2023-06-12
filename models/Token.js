const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class Token {
    static async findById({id}) {
        const sql = `SELECT * FROM tokens WHERE user = ?`
        const [token, _] = await db.execute(sql, [id])
        return token[0]
    }

    static async createToken({refresh_token, user}) {
        const dateTime = getCurrentDateTime()
        const sql = `INSERT INTO tokens(
            refresh_token,
            user,
            is_valid,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?)
        `
        await db.execute(sql, [refresh_token, user, true, dateTime, dateTime])
    }

    static async deleteUserRefreshToken({userId}) {
        const sql = 
        `
            DELETE FROM tokens WHERE user = ?
        `
        await db.execute(sql, [userId])
    }
}

module.exports = Token