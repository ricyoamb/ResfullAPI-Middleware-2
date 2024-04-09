const pool = require('../config/config.js')
const { hashPassword, comparePassword } = require('../lib/bcrypt.js')
const { generateToken } = require('../lib/jwt.js')

class AuthController {
  static register = async (req, res, next) => {
    try {
      const { email, password, role } = req.body

      const hashPass = hashPassword(password)

      const insertSQL = `
        INSERT INTO
            users(email, password, role)
        VALUES 
            ($1,$2,$3)
        RETURNING
            *
        `

      const result = await pool.query(insertSQL, [email, hashPass, role])

      res.status(201).json(result.rows[0])
    } catch (err) {
      next(err)
    }
  }

  static login = async (req, res, next) => {
    try {
      const { email, password } = req.body
      const searchSQL = `
        SELECT 
            *
        FROM
            users
        WHERE
            email = $1
      `
      const result = await pool.query(searchSQL, [email])

      if (result.rows.length !== 0) {
        const foundUser = result.rows[0]

        if (comparePassword(password, foundUser.password)) {
          const accesToken = generateToken({
            id: foundUser.id,
            email: foundUser.email,
            role: foundUser.role,
          })
          res.status(200).json({ message: 'Login Succesfull', accesToken })
        } else {
          throw { name: 'InvalidCredential' }
        }
      } else {
        throw { name: 'InvalidCredential' }
      }
    } catch (err) {
      next(err)
    }
  }
}

module.exports = AuthController
