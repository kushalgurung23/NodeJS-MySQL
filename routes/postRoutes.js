const express = require('express')
const router = express.Router()
const {
    getAllPosts,
    createNewPost,
    getPostById,
    updatePost,
    deletePost,
    deletePostImage
} = require('../controllers/postControllers')

router.route('/').get(getAllPosts).post(createNewPost)
router.route("/:id").get(getPostById).patch(updatePost).delete(deletePost)
router.route("/image/:id").delete(deletePostImage)

module.exports = router