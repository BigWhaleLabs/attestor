# Credentials attestor

Node server that generates EDDSA signatures as attestations for a specific credential.

## Installation and local launch

1. Clone this repo: `git clone https://github.com/BigWhaleLabs/zk-proof-generator`
2. Create `.env` with the environment variables listed below
3. Run `yarn` in the root folder
4. Run `yarn start`

And you should be good to go! Feel free to fork and submit pull requests.

## Environment variables (`*` is required)

| Name                | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `SMTP_USER`         | \* SMTP username for email verification                                    |
| `SMTP_PASS`         | \* SMTP password for email verification                                    |
| `EDDSA_PRIVATE_KEY` | \* EdDSA private key for signing the attestations                          |
| `ECDSA_PRIVATE_KEY` | \* ECDSA private key for signing the attestations                          |
| `PORT`              | Port to run server on (defaults to 1337)                                   |
| `ETH_NETWORK`       | Ethereum network (defaults to @bwl/constants)                              |
| `ETH_RPC`           | Ethereum node RPC URI (defaults to @bwl/constants)                         |
| `ETH_RPC_MAINNET`   | Ethereum mainnet node RPC URI (defaults to @bwl/constants)                 |
| `DOMAIN`            | Domain name for caddy, DNS should point at the IP where the code is hosted |
| `ENVIRONMENT`       | Environment name (defaults to `development`)                               |

Also, please, consider looking at `.env.sample`.

## Docker scripts

| Command                          | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `yarn docker-start-development`  | Starts the server in development mode with live reload                        |
| `yarn docker-start-production`   | Starts the server in production mode (must have DNS pointing to this machine) |
| `docker-start-production-no-dns` | Starts the server in production mode (no DNS required)                        |
