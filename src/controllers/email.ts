import { Request, Response } from 'express'
import dotenv from 'dotenv'
import Mailjet from 'node-mailjet'
import { add } from 'date-fns'
import { Job } from '@hokify/agenda'
import { agenda } from '../configs/agenda'

dotenv.config()

interface JobData {
  email: string,
  subject: string,
  body: string,
  sendingDate: string
}

const generateRandom = (min: number, max: number) => {
  const difference = max - min

  let random = Math.random()
  random = Math.floor(random * difference)
  random = random + min
  return random
}

const generateDate = (option: string) => {
  switch (option) {
    case '1week':
      return generateRandom(7, 14)
    case '2week':
      return generateRandom(14, 21)
    case '1month':
      return generateRandom(30, 60)
    default:
      return generateRandom(0, 3)
  }
}

export const sendEmail = async (req: Request, res: Response) => {
  // options: 1 week, 2 weeks 1 month

  const { email, subject, body, sendingDate } = req.body
  const scheduleTime = add(new Date(), { minutes: generateDate(sendingDate) })
  console.log(scheduleTime.toLocaleTimeString())

  try {
    const job = await agenda.schedule(scheduleTime, 'sendEmail', { email, subject, body, sendingDate })
    if (job) {
      defineJob()
      res.status(200).json({ success: true })
    }
  } catch (err) {
    console.log(err, 'err')
  }
}

const mailJob = async (job: Job<JobData>, done: (error?: Error) => void) => {
  const { email, subject, body, sendingDate } = job.attrs.data
  const mailjet = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_API_SECRET
  })

  mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'mail.me@lexiechoi.com',
          Name: 'Mail Me'
        },
        To: [
          {
            Email: email,
            Name: 'Me'
          }
        ],
        Subject: subject,
        HTMLPart: `<h1>${body} ${sendingDate}</h1>`
      }
    ]
  })
  done()
}
export const defineJob = async () => {
  agenda.define('sendEmail', mailJob)

  await new Promise(resolve => agenda.once('ready', resolve))
}
