const express = require('express')
const router = express.Router()
const {
    getAllPosts,
    createNewPost,
    getPostById,
    updatePost,
    deletePost
} = require('../controllers/postControllers')

router.route('/').get(getAllPosts).post(createNewPost)
router.route("/:id").get(getPostById).patch(updatePost).delete(deletePost)

module.exports = router