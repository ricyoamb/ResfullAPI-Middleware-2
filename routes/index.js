const express = require('express')
const router = express.Router()

const productRouter = require('./product.route.js')
const storeRouter = require('./store.route.js')

router.use('/api/products', productRouter)
router.use('/api/stores', storeRouter)

module.exports = router
