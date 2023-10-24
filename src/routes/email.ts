import express from 'express'
import { generateEmail } from '../controllers/email'

const router = express.Router()

router.post('/', generateEmail)

export default router
