const express = require('express')
const router = express.Router()
const pool = require('../config/config.js')
const ProductController = require('../controllers/product.controller.js')
const  {authorization} = require('../middlewares/auth.js')

router.get('/', ProductController.findAll)
router.get('/:id', ProductController.findOne)
router.post('/', authorization, ProductController.create)
router.put('/:id', authorization, ProductController.update)
router.delete('/:id', authorization, ProductController.destroy)

module.exports = router;