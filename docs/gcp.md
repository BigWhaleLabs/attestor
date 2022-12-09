# Running SealHub Prover on Google Cloud Platform

1. Go to [Google Cloud Console (Compute Engine API)](https://console.cloud.google.com/compute/instances) and press the "ENABLE" button if it isn't yet enabled (it might ask you to also create and enable billing)
2. Press the "CREATE INSTANCE" button
3. Select the following options (keep other options as default):
   | Option | Value |
   | --------------------------------------- | ------------- |
   | Machine Configuration -> Machine type | e2-standard-2 |
   | Firewall -> Allow HTTPS | Checked (yes) |
4. Go to the "Boot disk" section and press the "CHANGE" button
5. In the "Operating system" dropdown menu select "Ubuntu" (keep other options as default)
6. Press the "SELECT" button
7. Press the "CREATE" button at the end of the page
8. Press the "SSH" button on the created instance
9. Run the following script:

```bash
bash <(curl -o- https://raw.githubusercontent.com/BigWhaleLabs/attestor/main/scripts/install.sh)
```

7. Note the attestor URL that will be displayed in the end
