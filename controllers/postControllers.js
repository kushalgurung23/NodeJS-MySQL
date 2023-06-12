const Post = require('../models/Post')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')

const getAllPosts = async (req, res) => {
    const posts = await Post.findAll()
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: posts.length, posts})
}

const createNewPost = async (req, res) => {
    const {title, body} = req.body
    if(!title || !body) {
        throw new CustomError.BadRequestError('Please provide both title and body')
    }
    const post = new Post({title, body})
    await post.save();
    res.status(StatusCodes.CREATED).json({status: "Success",  msg: "Post is created successfully"})
}

const getPostById = async (req, res) => {
    const {id:postId} = req.params
    const post = await Post.findById(postId)
    if(!post) {
      throw new CustomError.NotFoundError(`Post of id: ${postId} is not available.`)
    }
    res.status(StatusCodes.OK).json({status: "Success", post: post})
}

const updatePost = async (req, res) => {
    const {id:postId} = req.params
  
    if(Object.keys(req.body).length === 0) {
        throw new CustomError.BadRequestError('Post details cannot be empty')
    }
    const post = await Post.findById(postId)
    if(!post) {
        throw new CustomError.NotFoundError(`Post of id: ${postId} does not exists.`)
    }
    await Post.updateById({postId, toBeUpdatedFields: req.body})
    res.status(StatusCodes.OK).json({status: "Success", msg: "Post is updated successfully."})
}

const deletePost = async (req, res) => {
    const {id:postId} = req.params
    const post = await Post.findById(postId)
    if(!post) {
        throw new CustomError.NotFoundError(`Post of id: ${postId} does not exists.`)
    }
    await Post.deletePost({postId})
    res.status(200).json({status: 'Success', msg: "Post is deleted successfully."})

}

module.exports = {
    getAllPosts,
    createNewPost,
    getPostById,
    updatePost,
    deletePost
}