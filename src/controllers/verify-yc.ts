import { Body, Controller, Post } from 'amala'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import BalanceUniqueVerifyBody from '@/validators/BalanceUniqueVerifyBody'
import EmailUniqueVerifyBody from '@/validators/EmailUniqueVerifyBody'
import TokenBody from '@/validators/TokenBody'

@Controller('/verify-yc')
export default class VerifyYCController {
  @Post('/email-unique')
  sendUniqueEmail(@Body({ required: true }) { email }: EmailUniqueVerifyBody) {
    // Todo:
    // 1. Create `emailHash = poseidon([0, email])`, (0 = email attestation)
    // 2. Sign `[0, emailHash]` with EdDSA, (0 = yc attestation)
    // 3. Send email with signature (must look nice and ketl branded)
  }

  @Post('/twitter')
  twitter(@Body({ required: true }) { token }: TokenBody) {
    // Todo:
    // 1. Verify token
    // 2. Get userIdHash = poseidon([1, userId]), (1 = twitter attestation)
    // 3. Sign `[0, userIdHash]` with EdDSA, (0 = yc attestation)
    // 4. Return signature
  }

  @Post('/balance-unique')
  sendUniqueBalance(
    @Body({ required: true })
    {
      message,
      ownerAddress,
      signature,
      threshold,
      tokenAddress,
    }: BalanceUniqueVerifyBody & AddressVerifyBody
  ) {
    // Todo:
    // 1. Verify signature and that ownerAddress signed the signature
    // 2. Verify that ownerAddress owns at least threshold of tokenAddress (if tokenAddress is undefined, use ETH)
    // 3. Create `balanceHash = poseidon([2, ownerAddress, threshold, tokenAddress])`, (2 = balance attestation)
    // 4. Sign `[0, balanceHash]` with EdDSA, (0 = yc attestation)
    // 5. Return signature
  }
}
