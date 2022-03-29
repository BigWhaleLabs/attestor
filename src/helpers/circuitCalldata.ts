import * as ffjavascript from 'ffjavascript'

const {
  stringifyBigInts: stringifyBigInts$3,
  unstringifyBigInts: unstringifyBigInts$1,
} = ffjavascript.utils

// copy pasta p256 from snarkjs cli.cjs line 6726
const p256 = function (n: any) {
  let nstr = n.toString(16)
  while (nstr.length < 64) nstr = '0' + nstr
  nstr = `"0x${nstr}"`
  return nstr
}

// copy pasta zkeyExportSolidityCalldata from snarkjs cli.cjs line 6984 with some modifications.
export default function genSolidityCalldata(publicName: any, proofName: any) {
  const pub = unstringifyBigInts$1(publicName)
  const proof = unstringifyBigInts$1(proofName)

  let inputs = ''
  for (let i = 0; i < pub.length; i++) {
    if (inputs != '') inputs = inputs + ','
    inputs = inputs + p256(pub[i])
  }

  let S
  if (typeof proof.protocol === 'undefined' || proof.protocol == 'original') {
    S =
      `[${p256(proof.pi_a[0])}, ${p256(proof.pi_a[1])}],` +
      `[${p256(proof.pi_ap[0])}, ${p256(proof.pi_ap[1])}],` +
      `[[${p256(proof.pi_b[0][1])}, ${p256(proof.pi_b[0][0])}],[${p256(
        proof.pi_b[1][1]
      )}, ${p256(proof.pi_b[1][0])}]],` +
      `[${p256(proof.pi_bp[0])}, ${p256(proof.pi_bp[1])}],` +
      `[${p256(proof.pi_c[0])}, ${p256(proof.pi_c[1])}],` +
      `[${p256(proof.pi_cp[0])}, ${p256(proof.pi_cp[1])}],` +
      `[${p256(proof.pi_h[0])}, ${p256(proof.pi_h[1])}],` +
      `[${p256(proof.pi_kp[0])}, ${p256(proof.pi_kp[1])}],` +
      `[${inputs}]`
  } else if (proof.protocol == 'groth16' || proof.protocol == 'kimleeoh') {
    S =
      `[${p256(proof.pi_a[0])}, ${p256(proof.pi_a[1])}],` +
      `[[${p256(proof.pi_b[0][1])}, ${p256(proof.pi_b[0][0])}],[${p256(
        proof.pi_b[1][1]
      )}, ${p256(proof.pi_b[1][0])}]],` +
      `[${p256(proof.pi_c[0])}, ${p256(proof.pi_c[1])}],` +
      `[${inputs}]`
  } else {
    throw new Error('InvalidProof')
  }

  return S
}
