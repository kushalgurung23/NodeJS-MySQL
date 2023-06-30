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

    static async findAll({offset, limit, search, order_by, userId}) {
        // TOTAL COUNT
        let countSql = "SELECT COUNT(*) AS total_posts FROM posts WHERE is_active = ?"
        let countValues = [true]
        if(search) {
            countSql+= ` AND title LIKE ?`
            countValues.push(`%${search}%`)
        }
       
        const [count, countField] = await db.execute(countSql, countValues)
        const totalPostsCount = count[0].total_posts
        
        // COALESCE WILL RETURN EMPTY ARRAY WHEN SUB QUERY RETURNS 0 ROWS
        let postsSql = `SELECT JSON_OBJECT(
            'id', p.id,
            'title', p.title,
            'body', p.body,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'images', COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pi.id,
                            'url', pi.image
                        )
                    )
                    FROM posts_images pi
                    WHERE pi.post_id = p.id AND pi.is_active = ?
                ),
                JSON_ARRAY()
            ),
            'likes_count', (
                SELECT COUNT(*)
                FROM post_likes pl
                WHERE pl.post_id = p.id
            ),
            'is_liked', (
                SELECT CASE WHEN EXISTS (
                    SELECT 1
                    FROM post_likes pl
                    WHERE pl.post_id = p.id AND pl.liked_by = ?
                ) THEN 1 ELSE 0 END
            ),
            'created_by', (
                SELECT JSON_OBJECT(
                    'id', u.id,
                    'name', u.name,
                    'profile_picture', u.profile_picture
                )
                FROM users u 
                WHERE p.created_by = u.id
            )
        ) AS post
        FROM posts p
        WHERE p.is_active = ?`
       
        let postsValues = [true, !userId ? 0 : userId, true]
        if(search) {
            postsSql+= ` AND p.title LIKE ?`
            postsValues.push(`%${search}%`)
        }
        postsSql+= " GROUP BY p.id"
        // IF order_by query string is not selected, api will be sent in desc order
        if(!order_by) {
            postsSql+= " ORDER BY p.created_at DESC"
        }
        if(order_by) {
            // order_by will accept two values: created_at_asc or created_at_desc
            if(order_by === 'created_at_asc') {
                postsSql+= " ORDER BY p.created_at ASC"
            }
            // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
            else {
                postsSql+= " ORDER BY p.created_at DESC"
            }
        }
        postsSql+= " LIMIT ? OFFSET ?"
        postsValues.push(limit.toString(), offset.toString())
        
        const [posts, _] = await db.execute(postsSql, postsValues)
        
        if(posts.length === 0) {
            return {totalPostsCount, posts:false};
        }
        return {totalPostsCount, posts}
    }

    static async findById(id) {
        const sql = `SELECT id FROM posts where is_active = ? AND id = ?`
        const [post, _] = await db.execute(sql, [true, id])
        return post[0]
    }

    // WHEN WE WANT TO SEE DETAILS OF ONLY ONE POST
    static async getOnePost({postId, userId}) {

        const sql = `
        SELECT JSON_OBJECT(
            'id', p.id,
            'title', p.title,
            'body', p.body,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'images', COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pi.id,
                            'url', pi.image
                        )
                    )
                    FROM posts_images pi
                    WHERE pi.post_id = p.id AND pi.is_active = ?
                ),
                JSON_ARRAY()
            ),
            'likes_count', (
                SELECT COUNT(*)
                FROM post_likes pl
                WHERE pl.post_id = p.id
            ),
            'is_liked', (
                SELECT CASE WHEN EXISTS (
                    SELECT 1
                    FROM post_likes pl
                    WHERE pl.post_id = p.id AND pl.liked_by = ?
                ) THEN 1 ELSE 0 END
            ),
            'created_by', (
                SELECT JSON_OBJECT(
                    'id', u.id,
                    'name', u.name,
                    'profile_picture', u.profile_picture
                )
                FROM users u
                WHERE u.id = p.created_by
            )
        ) AS result
        FROM posts p
        WHERE p.id = ? AND p.is_active = ?
        `

        const [rows, _] = await db.execute(sql, [true, !userId ? 0 : userId, postId, true])
        if(rows.length === 0) {
            return false;
        }
        const post = rows[0].result
        return post
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

    // POST's status will be set to in_active
    static async deletePost({postId}) {
        const dateTime = getCurrentDateTime()
        const values = [false, dateTime, postId]
        // REMOVE post
        const postSql = `UPDATE posts SET is_active = ?, updated_at = ? WHERE id = ?`
        await db.execute(postSql, values)
        
        // REMOVE post's images
        const postImageSql = `UPDATE posts_images SET is_active = ?, updated_at = ? WHERE post_id = ?`
        await db.execute(postImageSql, values)
    }
}

module.exports = Post
