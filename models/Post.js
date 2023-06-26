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

    // static async findAll({offset, limit, search, order_by}) {
    //     // TOTAL COUNT
    //     let countSql = "SELECT COUNT(*) AS total_posts FROM posts WHERE is_active = ?"
    //     let countValues = [true]
    //     if(search) {
    //         countSql+= ` AND title LIKE ?`
    //         countValues.push(`%${search}%`)
    //     }
       
    //     const [count, countField] = await db.execute(countSql, countValues)
    //     const totalPostsCount = count[0].total_posts

    //     // POSTS
    //     let postsSql = `SELECT p.id, p.title, p.body, p.created_at, p.updated_at, 
    //     GROUP_CONCAT(pi.image SEPARATOR ';') AS images 
    //     FROM posts p LEFT JOIN (SELECT post_id, image FROM posts_images 
    //     WHERE is_active = ?) pi on p.id = pi.post_id WHERE p.is_active = ?`
       
    //     let postsValues = [true, true]
    //     if(search) {
    //         postsSql+= ` AND p.title LIKE ?`
    //         postsValues.push(`%${search}%`)
    //     }
    //     postsSql+= " GROUP BY p.id"
    //     // IF order_by query string is not selected, api will be sent in desc order
    //     if(!order_by) {
    //         postsSql+= " ORDER BY p.created_at DESC"
    //     }
    //     if(order_by) {
    //         // order_by will accept two values: created_at_asc or created_at_desc
    //         if(order_by === 'created_at_asc') {
    //             postsSql+= " ORDER BY p.created_at ASC"
    //         }
    //         // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
    //         else {
    //             postsSql+= " ORDER BY p.created_at DESC"
    //         }
    //     }
    //     postsSql+= " LIMIT ? OFFSET ?"
    //     postsValues.push(limit.toString(), offset.toString())
        
    //     const [posts, _] = await db.execute(postsSql, postsValues)

    //     // RETURNING IMAGES AS ARRAY
    //     const postData = posts.map(row => ({
    //           id: row.id,
    //           title: row.title,
    //           body: row.body,
    //           images: row.images ? row.images.split(';') : [],
    //           created_at: row.created_at,
    //           updated_at: row.updated_at
    //         }
    //       ));

    //     return {totalPostsCount, postData}
    // }

    // THIS METHOD IS TO CHECK WHETHER POST OF THIS ID EXISTS OR NOT
    
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
        let postsSql = `SELECT p.id, p.title, p.body, p.created_at, p.updated_at,
        GROUP_CONCAT(pi.id, ',', pi.image ORDER BY pi.id SEPARATOR ';') AS images
        FROM posts p
        LEFT JOIN posts_images pi ON p.id = pi.post_id AND pi.is_active = ?
        WHERE p.is_active = ?`;
       
        let postsValues = [true, true]
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
        
        const [rows, _] = await db.execute(postsSql, postsValues)

        const posts = [];

        for (const row of rows) {
          const post = {
            id: row.id,
            title: row.title,
            body: row.body,
            created_at: row.created_at,
            updated_at: row.updated_at,
            images: [],
          };
      
          const images = row.images ? row.images.split(';') : [];
      
          for (const image of images) {
            const [imageId, imagePath] = image.split(',');
            post.images.push({ id: parseInt(imageId), url: imagePath });
          }
      
          posts.push(post);
        }

        return {totalPostsCount, posts}
    }

    static async findById(id) {
        const sql = `SELECT id FROM posts where is_active = ? AND id = ?`
        const [post, _] = await db.execute(sql, [true, id])
        return post[0]
    }

    // WHEN WE WANT TO SEE DETAILS OF ONLY ONE POST
    static async getOnePost(id) {
        const sql = `SELECT p.id, p.title, p.body, p.created_at, p.updated_at,
        GROUP_CONCAT(pi.id, ',', pi.image ORDER BY pi.id SEPARATOR ';') AS images
        FROM posts p
        LEFT JOIN posts_images pi ON p.id = pi.post_id AND pi.is_active = ?
        WHERE p.id = ? AND p.is_active = ?
        GROUP BY p.id`;

        const [rows, _] = await db.execute(sql, [true, id, true])
        console.log(rows);
        if(rows.length === 0) {
            return false;
        }

        const post = {
            id: rows[0].id,
            title: rows[0].title,
            body: rows[0].body,
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at,
            images: [],
          };
        
        // images will have this pattern
        // images: '36,/uploads/post-115-ec3ecac8-114e-47a7-aaff-f183c2376c9d.jpeg;37,/uploads/post-115-5579746d-2cc3-4470-9176-0e99666247a8.jpeg'
        const images = rows[0].images ? rows[0].images.split(';') : [];
        
        for (const image of images) {
            const [imageId, imagePath] = image.split(',');
            post.images.push({ id: parseInt(imageId), url: imagePath });
        }
        return {post}
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