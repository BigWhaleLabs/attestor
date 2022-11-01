/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildBabyjub, buildMimc7 } from 'circomlibjs'

export default class {
  private babyJub: any
  F: any
  private mimc7: any

  async prepare() {
    this.babyJub = await buildBabyjub()
    this.F = this.babyJub.F
    this.mimc7 = await buildMimc7()
    return this
  }
  hash(elements: any[] | Uint8Array) {
    return this.F.toObject(this.mimc7.multiHash.bind(this.mimc7)(elements))
  }
  hashWithoutBabyJub(elements: any[] | Uint8Array) {
    return this.mimc7.multiHash.bind(this.mimc7)(elements)
  }
}
