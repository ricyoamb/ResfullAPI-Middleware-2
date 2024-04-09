const express = require('express')
const app = express()
const port = 3000
const router = require('./routes')
const errorHandler = require('./middlewares/errorHandler')

app.use(express.json())

app.use(router)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`app listening on ${port}`)
})
