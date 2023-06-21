const db = require('../config/db')
const mysql = require('mysql2')
const {getCurrentDateTime} = require('../utils')

class PostsImages {
    
    static async addSinglePostImage({postId, imagePath}) {
        const dateTime = getCurrentDateTime()
        const sql = 
        `
        INSERT INTO posts_images (
            post_id,
            image,
            created_at,
            updated_at,
            is_active
        )
        VALUES (?, ?, ?, ?, ?)
        `
        await db.execute(sql, [postId, imagePath, dateTime, dateTime, true])
    }

    static async addMultiplePostImages({postId, allImagesPath}) {
        const dateTime = getCurrentDateTime()
        let insertValues = []
        for(let i = 0; i < allImagesPath.length; i++) {
            insertValues.push([postId, allImagesPath[i].toString(), dateTime, dateTime, true])
        }

        const sql = 
        "INSERT INTO posts_images (post_id, image, created_at, updated_at, is_active) VALUES ?"
        await db.execute(mysql.format(sql, [insertValues]))
    }
}

module.exports = PostsImages