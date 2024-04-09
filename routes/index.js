const express = require('express')
const router = express.Router()

const productRouter = require('./product.route.js')
const storeRouter = require('./store.route.js')
const authRouter = require('./auth.route.js')
const {authentication} = require('../middlewares/auth.js')

router.use('/api/auth', authRouter)
router.use(authentication)
router.use('/api/products', productRouter)
router.use('/api/stores', storeRouter)

module.exports = router
