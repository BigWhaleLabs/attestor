# Credentials attestor

Node server that generates EDDSA signatures as attestations for a specific credential.

## Installation and local launch

1. Clone this repo: `git clone https://github.com/BigWhaleLabs/zk-proof-generator`
2. Create `.env` with the environment variables listed below
3. Run `yarn` in the root folder
4. Run `yarn start`

And you should be good to go! Feel free to fork and submit pull requests.

## Environment variables

| Name                | Description                                        |
| ------------------- | -------------------------------------------------- |
| `PORT`              | Port to run server on (defaults to 1337)           |
| `SMTP_USER`         | SMTP username for email verification               |
| `SMTP_PASS`         | SMTP password for email verification               |
| `EDDSA_PRIVATE_KEY` | EdDSA private key for signing the attestations     |
| `ETH_NETWORK`       | Ethereum network (defaults to @bwl/constants)      |
| `ETH_RPC`           | Ethereum node RPC URI (defaults to @bwl/constants) |

Also, please, consider looking at `.env.sample`.
