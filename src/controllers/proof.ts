import * as fs from 'fs'
import * as snarkjs from 'snarkjs'
import { Body, Controller, Post } from 'amala'
import ProofBody from '@/validators/ProofBody'

const vKey = JSON.parse(
  fs.readFileSync('./pot/verification_key.json').toString()
)

@Controller('/proof')
export default class ProofController {
  @Post('/')
  async proof(@Body({ required: true }) input: ProofBody) {
    console.log('Generating witness and creating proof!')

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      './build/OwnershipChecker_js/OwnershipChecker.wasm',
      './pot/OwnershipChecker_final.zkey'
    )

    console.log('Verifying proof!')
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof)

    if (res) {
      console.log('Verified!')
    } else {
      console.log('Invalid proof')
    }

    return proof
  }
}
