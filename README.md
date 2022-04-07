# ZK proof generator

Node server that generates zk proofs for the provided circom circuit.

## Installation and local launch

1. Clone this repo: `git clone https://github.com/BigWhaleLabs/zk-proof-generator`
2. Instal Mongo and run it
3. Create `.env` with the environment variables listed below
4. Run `yarn` in the root folder
5. Get the zkey file with the respective folder name `pot/OwnershipChecker_final.zkey` from [`street-cred-derivatives-contract`](https://github.com/BigWhaleLabs/street-cred-derivatives-contract)
6. Run `yarn develop`

And you should be good to go! Feel free to fork and submit pull requests.

## Environment variables

| Name    | Description                              |
| ------- | ---------------------------------------- |
| `PORT`  | Port to run server on (defaults to 1337) |
| `MONGO` | MongoDB connection string                |

Also, please, consider looking at `.env.sample`.
