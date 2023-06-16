const path = require('path')
const CustomError = require('../errors')
const uuid = require('uuid')

const uploadProductImage = async(req, res) => {
    // check if file exists
    if(!req.files) {
        throw new CustomError.BadRequestError('No file uploaded')
    }
    // check format
    const productImage = req.files.profile_picture;   
    if(!productImage.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please upload image');
    }
    // check size
    const maxSize = 40000000
    if(productImage.size > maxSize) {
        throw new CustomError.BadRequestError('Please upload image smaller than 40 MB')
    }
    // GENERATING UNIQUE ID FOR IMAGE
    const uniquePhotoId = uuid.v4();

    // IMAGE EXTENSION IS ADDED AT THE END. [.pop() will return the last item of array after splitted through delimiter "/"].
    const uniqueImageName = `${uniquePhotoId}.${productImage.mimetype.split("/").pop()}`;
    const imagePath = path.join(__dirname, '../public/uploads/'+`${uniqueImageName}`);
    
    await productImage.mv(imagePath);
    // return res.status(StatusCodes.OK).send({image: {src: `}`}});
    return `/uploads/${uniqueImageName}`;
}

module.exports = uploadProductImage