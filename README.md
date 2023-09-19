# Credentials attestor

Node server that generates EDDSA signatures as attestations for specific credentials.

## Deploying to Google Cloud

Visit [this tutorial](./docs/gcp.md) for Google Cloud installation

## Deploying to AWS

Visit [this tutorial](./docs/aws.md) for Amazon AWS installation

## Deploying to any VPS with `apt-get` and `bash` installed

Run the following cURL or Wget command to download and launch the attestor:

```bash
bash <(curl -o- https://raw.githubusercontent.com/BigWhaleLabs/attestor/main/scripts/install.sh)
```

```bash
bash <(wget -qO- https://raw.githubusercontent.com/BigWhaleLabs/attestor/main/scripts/install.sh)
```

Use `--non-interactive` flag to skip the interactive mode and use the default values

```bash
bash <(curl -o- https://raw.githubusercontent.com/BigWhaleLabs/attestor/main/scripts/install.sh) --non-interactive
```

```bash
bash <(wget -qO- https://raw.githubusercontent.com/BigWhaleLabs/attestor/main/scripts/install.sh) --non-interactive
```

Note the attestor URL that will be displayed in the end

## Local launch

### Using Docker

1. Clone this repo: `git clone https://github.com/BigWhaleLabs/attestor`
2. Create `.env` with the environment variables listed below
3. Run `yarn docker-start-development` or `yarn docker-start-production`

## Without Docker

1. Clone this repo: `git clone https://github.com/BigWhaleLabs/attestor`
2. Create `.env` with the environment variables listed below
3. Run `yarn` in the root folder
4. Run `yarn start`

And you should be good to go! Feel free to fork and submit pull requests.

## Environment variables (`*` is required)

| Name                  | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `SMTP_USER`           | \* SMTP username for email verification                                    |
| `SMTP_PASS`           | \* SMTP password for email verification                                    |
| `EDDSA_PRIVATE_KEY`   | \* EdDSA private key for signing the attestations                          |
| `ECDSA_PRIVATE_KEY`   | \* ECDSA private key for signing the attestations                          |
| `PORT`                | Port to run server on (defaults to 1337)                                   |
| `ETH_NETWORK`         | Ethereum network (defaults to @bwl/constants)                              |
| `ETH_POLYGON_NETWORK` | Ethereum network (defaults to @bwl/constants)                              |
| `ETH_RPC`             | Ethereum node RPC URI (defaults to @bwl/constants)                         |
| `ETH_RPC_MAINNET`     | Ethereum mainnet node RPC URI (defaults to @bwl/constants)                 |
| `ETH_RPC_POLYGON`     | Polygon node RPC URI (defaults to @bwl/constants)                          |
| `DOMAIN`              | Domain name for caddy, DNS should point at the IP where the code is hosted |
| `ENVIRONMENT`         | Environment name (defaults to `development`)                               |
| `KETL_HASHES_SOURCE`  | Link to merkle tree hashes for Ketl                                        |

Also, please, consider looking at `.env.sample`.

## Docker scripts

| Command                          | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `yarn docker-start-development`  | Starts the server in development mode with live reload                        |
| `yarn docker-start-production`   | Starts the server in production mode (must have DNS pointing to this machine) |
| `docker-start-production-no-dns` | Starts the server in production mode (no DNS required)                        |
