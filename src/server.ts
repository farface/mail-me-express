import express, { Request, Response } from 'express'
import compression from 'compression'

const app = express()

app.use(compression())

app.use('/', (req: Request, res: Response) => {
  res.send('Hello World')
})

const PORT = 8080
app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`)
})
