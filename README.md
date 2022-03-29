# ZK proof generator

Node server that generates zk proofs for the provided circom circuit.

## Installation and local launch

1. Clone this repo: `git clone https://github.com/BigWhaleLabs/zk-proof-generator`
2. Create `.env` with the environment variables listed below
3. Run `yarn` in the root folder
4. Get the file with the respective folder name `pot/OwnershipChecker_final.zkey`from [`street-cred-derivatives-contract`](https://github.com/BigWhaleLabs/street-cred-derivatives-contract)
5. Run `yarn develop`

And you should be good to go! Feel free to fork and submit pull requests.

## Environment variables

| Name   | Description                              |
| ------ | ---------------------------------------- |
| `PORT` | Port to run server on (defaults to 1337) |

Also, please, consider looking at `.env.sample`.
