const pool = require('../config/config.js')
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 2

class ProductController {
  static findAll = async (req, res, next) => {
    try {
      const filterStr = filterOption(req.query)
      const paginationStr = pagination(req.query)

      const countSQL = `
         SELECT
            COUNT(DISTINCT products.*)
        FROM
            products
        INNER JOIN product_stores
            ON products.id = product_stores.product_id
        INNER JOIN stores
            ON stores.id = product_stores.store_id
      `
      const dataCount = await pool.query(countSQL)

      let productSize = dataCount.rows[0]

      let { limit, page } = req.query

      limit = +limit || DEFAULT_LIMIT
      page = +page || DEFAULT_PAGE

      let totalPages = Math.ceil(+productSize.count / limit)

      const nextPage = page + 1 <= totalPages ? page + 1 : null
      const prevPage = page - 1 > 0 ? page - 1 : null

      const sql = `
            SELECT
                products.*,
                JSONB_AGG(JSONB_BUILD_OBJECT(
                    'store', stores.title,
                    'address', stores.address,
                    'quantity', product_stores.quantity
                )) AS stores
            FROM
                products
            INNER JOIN product_stores
                ON products.id = product_stores.product_id
            INNER JOIN stores
                ON stores.id = product_stores.store_id
            ${filterStr}
            GROUP BY
                products.id
            ${paginationStr}
        `

      const result = await pool.query(sql)
      res.status(200).json({
        data: result.rows,
        totalPages,
        currentPage: page,
        nextPage,
        prevPage,
      })
    } catch (err) {
      next(err)
    }
  }

  static findOne = async (req, res, next) => {
    try {
      const { id } = req.params
      const sql = `
            SELECT
                products.*,
                JSONB_AGG(JSONB_BUILD_OBJECT(
                    'store', stores.title,
                    'address', stores.address,
                    'quantity', product_stores.quantity
                )) AS stores
            FROM
                products
            INNER JOIN product_stores
                ON products.id = product_stores.product_id
            INNER JOIN stores
                ON stores.id = product_stores.store_id
            WHERE
                products.id = $1
            GROUP BY
                products.id
            `

      const result = await pool.query(sql, [id])

      if (result.rows.length === 0) {
        throw { name: 'ErrorNotFound', message: 'Product not found' }
      } else {
        res.status(200).json(result.rows[0])
      }
    } catch (err) {
      next(err)
    }
  }
  static create = async (req, res, next) => {
    try {
      const { title, sku, price, stores } = req.body

      const createSql = `
        INSERT INTO
            products(title, sku, price)
        VALUES
            ($1,$2,$3)
        RETURNING
            *
        `

      const result = await pool.query(createSql, [title, sku, price])

      if (stores && stores.length > 0) {
        let relationSql = `
            INSERT INTO
                product_stores(product_id, store_id, quantity)
            VALUES
            `

        let inputBuilder = ``
        const currentProduct = result.rows[0]

        for (let i = 0; i < stores.length; i++) {
          if (i === stores.length - 1) {
            inputBuilder += `(${currentProduct.id}, ${stores[i].id}, ${stores[i].quantity});`
          } else {
            inputBuilder += `(${currentProduct.id}, ${stores[i].id}, ${stores[i].quantity}),`
          }
        }

        relationSql += inputBuilder

        await pool.query(relationSql)
      }

      res
        .status(201)
        .json({ data: result.rows[0], message: 'Product added succesfully' })
    } catch (err) {
      next(err)
    }
  }
  static update = async (req, res, next) => {
    try {
      let { title, sku, price } = req.body
      const { id } = req.params

      const searchSQL = `
            SELECT
                *
            FROM
                products
            WHERE
                id = $1
            `

      const result = await pool.query(searchSQL, [id])

      if (result.rows.length !== 0) {
        const updateSQL = `
                UPDATE
                    products
                SET
                    title = $1,
                    sku = $2,
                    price = $3
                WHERE
                    id = $4
            `
        const currentProduct = result.rows[0]

        title = title || currentProduct.title
        sku = sku || currentProduct.sku
        price = price || currentProduct.price

        const data = await pool.query(updateSQL, [title, sku, price, id])
        res.status(200).json({ message: 'Product updated succesfully' })
      } else {
        throw { name: 'ErrorNotFound', message: 'Product not found' }
      }
    } catch (err) {
      next(err)
    }
  }
  static destroy = async (req, res, next) => {
    try {
      const { id } = req.params

      const searchSQL = `
        SELECT 
            *
        FROM
            products
        WHERE
        id = $1;
    `
      const result = await pool.query(searchSQL, [id])

      if (result.rows.length > 0) {
        const deleteSQL = `
            DELETE FROM
                products
            WHERE
                id = $1

        `
        await pool.query(deleteSQL, [id])
        res.status(200).json({ message: 'Product deleted successfully' })
      } else {
        throw { name: 'ErrorNotFound', message: 'Product not found' }
      }
    } catch (err) {
      next(err)
    }
  }
}

const filterOption = (params) => {
  if (Object.entries(params).length === 0) {
    return ''
  } else {
    const { store_id, min_price, max_price, q } = params

    let queryString = 'WHERE '

    let filterArray = []

    if (store_id) filterArray.push(`stores.id = ${store_id}`)
    if (min_price) filterArray.push(`products.price >= ${min_price} `)
    if (max_price) filterArray.push(`products.price <= ${max_price}`)
    if (q) filterArray.push(`products.title ILIKE '%${q}%'`)
    if (filterArray.length === 0) return ''

    queryString += filterArray.join(' AND ')
    return queryString
  }
}

const pagination = (params) => {
  if (Object.entries(params).length === 0) {
    return ' '
  } else {
    let { limit, page } = params

    limit = limit || DEFAULT_LIMIT
    page = page || DEFAULT_PAGE

    return ` LIMIT ${limit} OFFSET ${(page - 1) * limit} `
  }
}

module.exports = ProductController
