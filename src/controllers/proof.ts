import { Body, Controller, Post } from 'amala'
import ProofBody from '@/validators/ProofBody'

@Controller('/proof')
export default class ProofController {
  @Post('/')
  proof(@Body({ required: true }) { leaf }: ProofBody) {
    return { success: true, leaf }
  }
}
