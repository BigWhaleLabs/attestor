# Refresh package list
sudo apt-get update
# Remove old Docker installations
sudo apt-get remove -y docker docker-engine docker.io containerd runc
# Install packages required for Docker
sudo apt-get install -y ca-certificates curl gnupg lsb-release
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
  url=$(sudo docker logs proxy-lt | grep -oP 'https://\K.*')
  echo "==============================="
  echo "Your SealHub Attestor is running! It might take a minute for it to set everything up though. It has the following URL:"
  echo "$url"
  echo "You can safelly close this window now. The attestor will keep running."
  echo "==============================="
else 
  # Put the domain name in the .env
  echo "DOMAIN=$domain" >> .env
  # Ask the user to point DNS at the IP
  ip=$(curl -s ifconfig.me)
  echo "Please create an A record for $domain DNS pointing at $ip and press return when ready"
  read
  # Start production profile
  sudo docker compose --profile=production up -d
  echo "==============================="
  echo "Your SealHub Attestor is running! It might take a minute for it to set everything up though. It has the following URL:"
  echo "$domain"
  echo "You can safelly close this window now. The attestor will keep running"
  echo "==============================="
fi
