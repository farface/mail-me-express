import { Request, Response } from 'express'
import dotenv from 'dotenv'
import Mailjet from 'node-mailjet'
import { add } from 'date-fns'
import { Job } from '@hokify/agenda'
import { agenda } from '../configs/agenda'
import { openai } from '../configs/chatgpt'
import { questions, topics } from '../assets/data'

dotenv.config()

interface JobData {
  email: string;
  body: string;
  name: string;
}

export const generateEmail = async (req: Request, res: Response) => {
  const { email, topic, answers, firstname, lastname, date } = req.body
  if (!email || !date || !answers) {
    return res.status(400).json({ error: 'Missing properties. Email, date and answers are required' })
  }

  const name = `${firstname} ${lastname}`
  let body = await generateEmailBody(topic, answers)

  try {
    if (body) {
      body = body.replace('[Your Name]', name)
      body = body.replace('\n', '<br>')
      console.log(body, 'body')

      const job = await sendEmail(email, body, name, date)
      if (job) {
        res.status(200).json({ success: true })
      }
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ success: false })
  }
}

const generateEmailBody = async (topic: number, answers: string) => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{
      role: 'user', content: generateChatGPTPrompt(topic, answers)
    }],
    model: 'gpt-3.5-turbo'
  })
  return chatCompletion?.choices[0]?.message?.content
}

const generateChatGPTPrompt = (topic: number, answers: string) => {
  let prompt = 'Compose a letter will be send the future self without subject and salutation and add new line tag for each paragraph with the following content. The output should below 250 words \n '
  const choseTopic = topics.filter((t) => t.id === topic)[0]

  const choseQuestions = questions[choseTopic.id]

  const questionsStr = choseQuestions.join(',')

  prompt = `${prompt}Questions\n${questionsStr}`

  prompt = `${prompt}\nAnswers\n${answers}`

  console.log(prompt, 'prompt')
  return prompt
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
    case 'surprise':
      return generateRandom(14, 60)
    default:
      return generateRandom(0, 1)
  }
}

export const sendEmail = async (email: string, body: string, name: string, sendingDate: string) => {
  const scheduleTime = add(new Date(), { minutes: generateDate(sendingDate) })
  console.log(scheduleTime.toLocaleTimeString())

  const job = await agenda.schedule(scheduleTime, 'sendEmail', { email, body, name, sendingDate })

  if (job) {
    defineJob()
    return job
  }
  return null
}

const mailJob = async (job: Job<JobData>, done: (error?: Error) => void) => {
  const { email, body, name } = job.attrs.data
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
            Name: name
          }
        ],
        TemplateID: 5212937,
        TemplateLanguage: true,
        Variables: {
          name,
          body
        }
      }
    ]
  })
  done()
}

// const sendTestEmail = (email: string, body: string, name: string) => {
//   const mailjet = new Mailjet({
//     apiKey: process.env.MAILJET_API_KEY,
//     apiSecret: process.env.MAILJET_API_SECRET
//   })

//   mailjet.post('send', { version: 'v3.1' }).request({
//     Messages: [
//       {
//         From: {
//           Email: 'mail.me@lexiechoi.com',
//           Name: 'Mail Me'
//         },
//         To: [
//           {
//             Email: email,
//             Name: name
//           }
//         ],
//         // Subject: 'A Letter to My Future Self',
//         TemplateID: 5212937,
//         TemplateLanguage: true,
//         Variables: {
//           name,
//           body
//         }
//       }
//     ]
//   })
// }

export const defineJob = async () => {
  agenda.define('sendEmail', mailJob)

  await new Promise(resolve => agenda.once('ready', resolve))
}
