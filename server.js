require("dotenv").config(); // ALLOWS ENVIRONMENT VARIABLES TO BE SET ON PROCESS.ENV SHOULD BE AT TOP
require('express-async-errors')

const express = require("express");
const app = express();

// REQUIRE ROUTES
const postRouter = require('./routes/postRoutes')

// REQUIRE MIDDLEWARES
const errorHandlerMiddleware = require('./middlewares/error-handler')
const notFoundMiddleWare = require('./middlewares/not-found')

// MIDDLEWARE
app.use(express.json()); // parse json bodies in the request object

// ROUTES
app.use('/api/v1/posts', postRouter)

// MIDDLEWARE
app.use(notFoundMiddleWare);
app.use(errorHandlerMiddleware);

// Listen on pc port
const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
  }
  catch (error) {
    console.log(error);
  }
}

start()