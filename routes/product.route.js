const express = require('express')
const router = express.Router()
const pool = require('../config/config.js')
const ProductController = require('../controllers/product.controller.js')

router.get('/', ProductController.findAll)
router.get('/:id', ProductController.findOne)
router.post('/',ProductController.create)
router.put('/:id',ProductController.update)
router.delete('/:id',ProductController.destroy)

module.exports = router;