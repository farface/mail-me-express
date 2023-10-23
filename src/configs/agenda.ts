import { Agenda } from '@hokify/agenda'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.ATLAS_URI as string
export const agenda = new Agenda({ db: { address: uri }, processEvery: '1 minute' })

export const startAgenda = () => {
  agenda.start()
}
