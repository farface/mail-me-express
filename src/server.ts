import express, { Request, Response } from 'express'
import compression from 'compression'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { startAgenda } from './configs/agenda'
import emailRouter from './routes/email'
import cors from 'cors'

dotenv.config()

const app = express()

app.use(cors({
  origin: ['*'],
  methods: ['POST']
}))
app.use(compression())
app.use(bodyParser.json())
app.disable('x-powered-by')

startAgenda()

app.use('/email', emailRouter)

app.use('/', (req: Request, res: Response) => {
  res.send('Hello World')
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`)
})
