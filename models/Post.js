const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class Post {
    constructor({title, body}) {
        this.title = title
        this.body = body
    }

    async save() {
       const dateTime = getCurrentDateTime()
    
        const sql = `INSERT INTO posts(
            title,
            body, 
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?)`
        await db.execute(sql, [this.title, this.body, dateTime, dateTime]
        )
    }

    static async findAll() {
        const sql = "SELECT * from posts ORDER BY id DESC"
        const [posts, _] = await db.execute(sql)
        return posts
    }

    static async findById(id) {
        const sql = `SELECT * FROM posts WHERE id = ?`
        const [post, _] = await db.execute(sql, [id])
        return post[0]
    }

    static async updateById({toBeUpdatedFields, postId}) {
     
        const dateTime = getCurrentDateTime()

        let query = 'UPDATE posts SET ';
        let values = [];
        let i = 0;

        for (const field in toBeUpdatedFields) {
            // For first field, we do not wanna add comma in the query
            if (i > 0) {
                query += ', ';
            }
            query += field + ' = ?';
            values.push(toBeUpdatedFields[field]);
            i++;
        }

        query += ', updated_at = ?'
        query += ' WHERE id = ?';
        values.push(dateTime)
        values.push(postId);

        await db.execute(query, values)
    }

    static async deletePost({postId}) {
        const sql = `DELETE FROM posts
        WHERE id = ?
        `
        await db.execute(sql, [postId])
    }
}

module.exports = Post