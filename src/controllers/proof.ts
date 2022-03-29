import { Body, Controller, Post } from 'amala'
import * as snarkjs from 'snarkjs'
import * as fs from 'fs'
import ProofBody from '@/validators/ProofBody'
import createInput from '@/helpers/createInput'
// import genSolidityCalldata from '@/helpers/circuitCalldata'

@Controller('/proof')
export default class ProofController {
  @Post('/')
  async proof(@Body({ required: true }) { leaf }: ProofBody) {
    const input = await createInput(leaf)

    console.log('Generating witness and creating proof!')

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      './build/OwnershipChecker_js/OwnershipChecker.wasm',
      './pot/OwnershipChecker_final.zkey'
    )

    // const genCalldata = await genSolidityCalldata(publicSignals, proof)
    console.log('Verifying proof!')
    const vKey = JSON.parse(
      fs.readFileSync('./pot/verification_key.json').toString()
    )
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof)

    if (res) {
      console.log('Verified!')
    } else {
      console.log('Invalid proof')
    }

    return proof
  }
}
