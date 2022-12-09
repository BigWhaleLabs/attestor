# Running SealHub Prover on Amazon Web Services

1. Go to [AWS EC2 console](https://us-east-1.console.aws.amazon.com/ec2/)
2. Press the "Launch instance" button and select "Launch instance"
3. Select the following options (keep others as default):
   | Option | Value |
   | ------------------- | -------------------- |
   | Application and OS images | Ubuntu |
   | Instance type | `t2.large` or better |
   | Key pair (login) | "Proceed without a key pair" |
   | Network settings -> "Allow HTTPS traffic from the internet" | Checked |
4. Press the "Launch instance" button
5. Wait until instance loads and press the "Connect to instance" button
6. Make sure that "EC2 Instance Connect" is selected and press the "Connect" button (you might need to wait for the instance to start, otherwise you will see an error)
7. Run the following script:

```bash
bash <(curl -o- https://raw.githubusercontent.com/BigWhaleLabs/attestor/main/scripts/install.sh)
```

8. Note the attestor URL that will be displayed in the end
