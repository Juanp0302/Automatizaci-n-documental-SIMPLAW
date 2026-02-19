# AWS EC2 Deployment Guide

## Prerequisites
- AWS Account
- SSH Key Pair (`.pem` file)

## Steps

### 1. Launch EC2 Instance
- **OS**: Ubuntu Server 22.04 LTS (recommended)
- **Instance Type**: t2.small or t2.medium (t2.micro might run out of RAM with LibreOffice + Java)
- **Security Group**: Allow Inbound HTTP (80), HTTPS (443), and SSH (22).

### 2. Connect to Instance
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

### 3. Install Docker & Docker Compose
```bash
# Update repositories
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get install -y docker-compose
```

### 4. Deploy Application
Since this is a private project, you can either:
- **Option A (Git)**: Clone the repository (you'll need to set up SSH keys or use HTTPS token).
- **Option B (SCP)**: Copy the files directly from your local machine.

#### Option B: Copy Files (Run from your local machine)
```powershell
# Copy the entire project folder (excluding venv/node_modules ideally)
# It's cleaner to zip the required files first or use rsync if on Linux/Mac.
# On Windows, you can use SCP:
scp -i "your-key.pem" -r "c:\Path\To\Project" ubuntu@your-ec2-ip:~/app
```

### 5. Run Containers
On the EC2 instance:
```bash
cd ~/app
docker-compose up -d --build
```

### 6. Verification
- Access `http://your-ec2-public-ip` in your browser.
- Test login, file uploads, and **PDF generation**.

## Troubleshooting
- **Logs**: `docker-compose logs -f`
- **Rebuild**: `docker-compose up -d --build`
- **Permissions**: Ensure `generated_docs` and `templates` directories are writable by the container user.
