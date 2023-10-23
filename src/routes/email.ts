import express from 'express'
import { sendEmail } from '../controllers/email'

const router = express.Router()

router.post('/generate', sendEmail)

export default router
