# Refresh package list
sudo apt-get update
# Remove old Docker installations
sudo apt-get remove -y docker docker-engine docker.io containerd runc
# Install packages required for Docker
sudo apt-get install -y ca-certificates curl gnupg lsb-release build-essentials
# Add Docker official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# Add Docker repository to dpkg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# Refresh package list once again after adding new repo
sudo apt-get update
# Install Docker and required packages
sudo apt-get install -y git docker-ce docker-ce-cli containerd.io docker-compose-plugin
# Clone SealHub Attestor repository
git clone https://github.com/BigWhaleLabs/attestor.git
cd attestor

# Check if ECDSA_PRIVATE_KEY already exists in .env
if grep -q "^ECDSA_PRIVATE_KEY=" .env; then
  echo "ECDSA_PRIVATE_KEY already exists in .env file, skipping."
else
  # Generate a private key using openssl
  private_key=$(openssl ecparam -name secp256k1 -genkey -noout | openssl ec -text -noout | grep priv -A 3 | tail -n +2 | tr -d '\n[:space:]:' | sed 's/^00//')

  # Append the private key to an existing .env file
  echo "ECDSA_PRIVATE_KEY=0x$private_key" >> ../.env

  # Print the private key to the console for verification
  echo "ECDSA PRIVATE KEY key: $private_key"
fi

# Check if EDDSA_PRIVATE_KEY already exists in .env
if grep -q "^EDDSA_PRIVATE_KEY=" .env; then
  echo "EDDSA_PRIVATE_KEY already exists in .env file, skipping."
else
  # Generate a private key using openssl
  private_key=$(openssl ecparam -name secp256k1 -genkey -noout | openssl ec -text -noout | grep priv -A 3 | tail -n +2 | tr -d '\n[:space:]:' | sed 's/^00//')

  # Append the private key to an existing .env file
  echo "EDDSA_PRIVATE_KEY=0x$private_key" >> ../.env

  # Print the private key to the console for verification
  echo "EDDSA PRIVATE KEY key: $private_key"
fi

if [ -z "$1" ] 
then
  # Ask if user has a custom domain, if he doesn't launch the attestor without DNS, if he does take the name from the user and put it to the .env
  echo 'If you have a custom domain, enter it here; if not, just press "return" and leave it blank'
  # Read the domain from the user
  read domain
fi 

if [ "$1" == "--non-interactive" ] || [ -z "$domain" ]
then
  # Start production profile without custom domain
  sudo docker compose --profile=production-no-dns up -d
  echo "Waiting 10 seconds for the proxy to start..."
  sleep 10
  url=$(sudo docker logs attestor-proxy-lt | grep -oP 'https://\K.*')

else 
  # Put the domain name in the .env
  echo "DOMAIN=$domain" >> .env
  # Ask the user to point DNS at the IP
  ip=$(curl -s ifconfig.me)
  echo "Please create an A record for $domain DNS pointing at $ip and press return when ready"
  read
  # Start production profile
  sudo docker compose --profile=production up -d
fi

if [ -n "$url" ]; then
  server="$url"
else
  server="https://$domain"
fi

echo "==============================="
echo "Your SealHub Attestor is running! It might take a minute for it to set everything up though. It has the following URL:"
echo "$server"

endpoint_url="$server/v0.2.1/verify/eddsa-public-key"

counter=0

while true; do
  response=$(curl -s -w "\n%{http_code}\n" "$endpoint_url")

  body=$(echo "$response" | sed '$d')
  code=$(echo "$response" | tail -n 1)

  if [ "$code" -eq 200 ]; then
    attestor_public_key=$(echo "$body" | sed -e 's/^.*"x":[[:space:]]*"//' -e 's/".*$//')

    echo "Your attestor public key is:"
    echo "$attestor_public_key"
    break
  fi

  counter=$((counter+1))
  echo "Waiting 5 seconds for next request..."
  sleep 5

  if [ "$(($counter % 5))" -eq 0 ]; then
    echo "Still waiting for response..."
  fi
done

echo "You can safelly close this window now. The attestor will keep running."
echo "==================================="

