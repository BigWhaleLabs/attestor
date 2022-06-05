# ZK proof generator

Node server that generates zk proofs for the provided circom circuit.

## Installation and local launch

1. Clone this repo: `git clone https://github.com/BigWhaleLabs/zk-proof-generator`
2. Instal Mongo and run it
3. Create `.env` with the environment variables listed below
4. Run `yarn` in the root folder
5. Get the zkey file with the respective folder name `pot/OwnershipChecker_final.zkey` from [`seal-cred-verifier-contract`](https://github.com/BigWhaleLabs/seal-cred-verifier-contract)
6. Run `yarn develop`

And you should be good to go! Feel free to fork and submit pull requests.

## Environment variables

| Name                | Description                                        |
| ------------------- | -------------------------------------------------- |
| `PORT`              | Port to run server on (defaults to 1337)           |
| `MONGO`             | MongoDB connection string                          |
| `SMTP_USER`         | SMTP username for email verification               |
| `SMTP_PASS`         | SMTP password for email verification               |
| `EDDSA_PRIVATE_KEY` | EdDSA private key for signing the attestations     |
| `ETH_NETWORK`       | Ethereum network (defaults to @bwl/constants)      |
| `ETH_RPC`           | Ethereum node RPC URI (defaults to @bwl/constants) |

Also, please, consider looking at `.env.sample`.
