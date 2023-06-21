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
            updated_at,
            is_active
        )
        VALUES (?, ?, ?, ?, ?)`
        const [result] = await db.execute(sql, [this.title, this.body, dateTime, dateTime, true])
        return(result.insertId);
    }

    static async findAll({offset, limit, search, order_by}) {
        // TOTAL COUNT
        let countSql = "SELECT COUNT(*) AS total_posts FROM posts WHERE is_active = ?"
        let countValues = [true]
        if(search) {
            countSql+= ` AND title LIKE ?`
            countValues.push(`%${search}%`)
        }
       
        const [count, countField] = await db.execute(countSql, countValues)
        const totalPostsCount = count[0].total_posts

        // POSTS
        let postsSql = "SELECT * from posts WHERE is_active = ?"
        let postsValues = [true]
        if(search) {
            postsSql+= ` AND title LIKE ?`
            postsValues.push(`%${search}%`)
        }
        // IF order_by query string is not selected, api will be sent in desc order
        if(!order_by) {
            postsSql+= " ORDER BY created_at DESC"
        }
        if(order_by) {
            // order_by will accept two values: created_at_asc or created_at_desc
            if(order_by === 'created_at_asc') {
                postsSql+= " ORDER BY created_at ASC"
            }
            // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
            else {
                postsSql+= " ORDER BY created_at DESC"
            }
        }
        postsSql+= " LIMIT ? OFFSET ?"
        postsValues.push(limit.toString(), offset.toString())

        console.log(postsSql);
        console.log(postsValues);
        
        const [posts, _] = await db.execute(postsSql, postsValues)
        return {totalPostsCount, posts}
        
        // COUNT SQL QUERY AND ITS VALUES WILL BE
        // SELECT COUNT(*) AS total_posts FROM posts WHERE is_active = ? AND title LIKE ?
        // [ true, '%chels%' ]

        // POSTS SQL QUERY AND ITS VALUES WILL BE
        // SELECT * from posts WHERE is_active = ? AND title LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?
        // [ true, '%chels%', '10', '0' ]
    }

    static async findById(id) {
        const sql = `SELECT * FROM posts WHERE id = ? AND is_active = ?`
        const [post, _] = await db.execute(sql, [id, true])
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
        query += ' AND is_active = ?';
        values.push(dateTime, postId, true)
        await db.execute(query, values)
        // THE QUERY AND ITS VALUES WILL BE
        // UPDATE posts SET body = ?, updated_at = ? WHERE id = ? AND is_active = ?
        // [ 'Good team of England.', '2023-06-16 07:23:01', '15', true ]
    }

    static async deletePost({postId}) {
        const sql = `DELETE FROM posts
        WHERE id = ? AND is_active = ?
        `
        await db.execute(sql, [postId, true])
    }
}

module.exports = Post