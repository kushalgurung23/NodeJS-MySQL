const Post = require('../models/Post')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')
const {uploadSingleImage, uploadMultipleImages, ImageTypeEnum} = require('../utils/')
const PostsImages = require('../models/PostsImages')

const getAllPosts = async (req, res) => {
    const userId = req.user.userId
    const {search, order_by} = req.query
    
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1) * limit

    const {totalPostsCount, posts} = await Post.findAll({offset, limit, search, order_by, userId})
    if(!posts) {
        return res.status(StatusCodes.OK).json({
            status: "Success",
            count: totalPostsCount, 
            page,
            limit,
            posts: []})
    }
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalPostsCount, 
        page,
        limit,
        posts})
}

const createNewPost = async (req, res) => {

    const {title, body} = req.body
    if(!title || !body) {
        throw new CustomError.BadRequestError('Please provide both title and body.')
    }
    const post = new Post({title, body})
    const newPostId = await post.save();
    // IF POST ALSO HAS IMAGES
    if(req.files) {
        const imageFiles = req.files.image
        // MULTIPLE IMAGES
        if(imageFiles.length && imageFiles.length > 1) {
            const allImagesPath = await uploadMultipleImages(req, res, newPostId, ImageTypeEnum.postImage)
            if(allImagesPath) {
                await PostsImages.addMultiplePostImages({postId: newPostId, allImagesPath})
            }
        }
        // SINGLE IMAGE
        else if(!imageFiles.length) {
            const imagePath = await uploadSingleImage(req, res, newPostId, ImageTypeEnum.postImage)
            if(imagePath) {
                await PostsImages.addSinglePostImage({postId: newPostId, imagePath})
            }
        }
    }

    res.status(StatusCodes.CREATED).json({status: "Success",  msg: "Post is created successfully."})
}

const getPostById = async (req, res) => {
    const {id:postId} = req.params
    const post = await Post.getOnePost({postId, userId: req.user.userId})
    if(!post) {
      throw new CustomError.NotFoundError(`Post of id: ${postId} is not available.`)
    }
    res.status(StatusCodes.OK).json({status: "Success", post: post})
}

const updatePost = async (req, res) => {
    const {id:postId} = req.params
  
    if(Object.keys(req.body).length === 0) {
        throw new CustomError.BadRequestError('Post details cannot be empty.')
    }
    const post = await Post.findById(postId)
    if(!post) {
        throw new CustomError.NotFoundError(`Post of id: ${postId} does not exists.`)
    }
    await Post.updateById({postId, toBeUpdatedFields: req.body})
    res.status(StatusCodes.OK).json({status: "Success", msg: "Post is updated successfully."})
}

const deletePost = async (req, res) => {
    if(!req.params.id) {
        throw new CustomError.BadRequestError('Provide post id.')
    }
    const {id:postId} = req.params
    const post = await Post.findById(postId)
    
    if(!post || post?.is_active === 0) {
        throw new CustomError.NotFoundError(`Post of id: ${postId} does not exists.`)
    }
    await Post.deletePost({postId})
    res.status(200).json({status: 'Success', msg: "Post is deleted successfully."})
}

const deletePostImage = async (req, res) => {
    if(!req.params.id) {
        throw new CustomError.BadRequestError('Provide post\'s image id.')
    }

    const {id:imageId} = req.params
    const postImage = await PostsImages.findPostImageById({imageId})
    if(!postImage) {
        throw new CustomError.NotFoundError(`Post image of id: ${imageId} does not exists.`)
    }
    await PostsImages.deletePostImage({imageId})
    res.status(200).json({status: 'Success', msg: "Post image is deleted successfully."})
}

module.exports = {
    getAllPosts,
    createNewPost,
    getPostById,
    updatePost,
    deletePost,
    deletePostImage
}