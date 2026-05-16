# Flask + React Deployment Guide (EC2 + Nginx + Gunicorn + SSL)

## Prerequisites

- AWS EC2 instance (Amazon Linux 2023)
- EC2 security group with inbound rules: HTTP (80) and HTTPS (443) open to 0.0.0.0/0
- DuckDNS account with a domain pointing to your EC2 public IP
- GitHub account
- AWS RDS PostgreSQL instance (or other remote database)

> If any of these are not ready, complete them first. Certbot will fail if the domain does not resolve to your server's IP.

---

## Part 1 — Local: Configure Vite for Flask

> **Note:** Vite 8 (Rolldown) does not allow `..` in `assetsDir`. The solution is to set `outDir` to point directly at the backend's `static/` folder and use a post-build script to copy `index.html` into `templates/`. The paths depend on whether your frontend and backend are in the same repo or separate repos — pick the case that matches your setup below.

**If your frontend is a subfolder inside the backend repo** (e.g. `shopapp/shopapp-frontend/`), `../` goes up one level into `shopapp/`:

`vite.config.js` build section:

```js
build: {
  outDir: "../static",
  assetsDir: "assets",
  emptyOutDir: false,
},
```

`build:flask` script in `package.json`:

```json
"build:flask": "vite build --base=/static/ && node -e \"const fs=require('fs');fs.mkdirSync('../templates',{recursive:true});fs.copyFileSync('../static/index.html','../templates/index.html');\""
```

**If your frontend and backend are in separate repos** cloned side by side (e.g. `~/app/shopapp-frontend/` and `~/app/shopapp/`), the paths need to cross into the backend folder:

`vite.config.js` build section:

```js
build: {
  outDir: "../shopapp/static",
  assetsDir: "assets",
  emptyOutDir: false,
},
```

`build:flask` script in `package.json`:

```json
"build:flask": "vite build --base=/static/ && node -e \"const fs=require('fs');fs.mkdirSync('../shopapp/templates',{recursive:true});fs.copyFileSync('../shopapp/static/index.html','../shopapp/templates/index.html');\""
```

> If your directory structure is different, update these paths so they point to where `static/` and `templates/` actually live inside your backend repo.

Both scripts:

- Build React with asset URLs prefixed `/static/` (where Flask serves static files)
- Copy `index.html` into Flask's `templates/` folder automatically

---

## Part 2 — Local: Update .gitignore

Make sure `static/assets/` is NOT in `.gitignore` so built assets get pushed to GitHub.

`.gitignore` should include:

```text
venv/
__pycache__/
*.pyc
.env
shopapp-frontend/node_modules/
shopapp-frontend/dist/
```

---

## Part 3 — Local: Build Frontend and Push to GitHub

```bash
cd shopapp-frontend
npm run build:flask
cd ..
```

Initialize git and push to GitHub:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR-USERNAME/shopapp.git
git push -u origin main
```

> Create the GitHub repo first at github.com (empty, no README).

---

## Part 4 — EC2: Connect via EC2 Instance Connect

Instead of using a terminal with SSH, connect directly from the browser:

1. Go to the AWS Console → EC2 → Instances
2. Select your instance and click **Connect**
3. Choose the tab **EC2 Instance Connect**
4. Click the orange button **Connect**

A browser terminal will open connected to your server. No SSH keys or external tools needed.

---

## Part 5 — EC2: Update the System and Install Dependencies

```bash
sudo dnf update -y
sudo dnf install python3.12 python3.12-pip git nginx certbot python3-certbot-nginx -y
```

What each package does:

- `dnf update` — Updates all existing packages to their latest secure versions
- `python3.12` — Python runtime; the Flask app runs on Python
- `python3.12-pip` — Pip package manager for installing Python libraries
- `git` — Downloads the Flask project from GitHub onto the server
- `nginx` — Web server that receives traffic on ports 80/443 and forwards it to Flask on port 5000
- `certbot` — Requests and installs a free SSL certificate from Let's Encrypt
- `python3-certbot-nginx` — Certbot plugin that modifies Nginx config to enable HTTPS automatically

---

## Part 6 — EC2: Verify Installations

```bash
python3.12 --version
pip3.12 --version
nginx -v
git --version
certbot --version
```

You should see a version number for each. If any command returns "not found", re-run Part 5.

---

## Part 7 — EC2: Clone and Install Dependencies

```bash
mkdir ~/app
git clone https://github.com/YOUR-USERNAME/shopapp.git ~/app/shopapp
cd ~/app/shopapp
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

- `mkdir ~/app` — Creates a parent directory to organize your project
- `python3.12 -m venv venv` — Creates an isolated virtual environment so project libraries don't conflict with the system Python
- `source venv/bin/activate` — Activates it; your prompt will show `(venv)` when active
- `pip install gunicorn` — Production-grade Python web server; Flask's built-in server is not safe for production

> **If your frontend is in a separate repo**, also install Node.js and clone it alongside the backend, then build:
>
> ```bash
> sudo dnf install nodejs -y
> git clone https://github.com/YOUR-USERNAME/shopapp-frontend.git ~/app/shopapp-frontend
> cd ~/app/shopapp-frontend
> npm install
> npm run build:flask
> ```
>
> Make sure the paths in `vite.config.js` and `package.json` match this directory structure — see Part 1 for the separate-repos version of those scripts.

---

## Part 8 — EC2: Create .env File

The `.env` is gitignored and must be created manually on EC2:

```bash
nano ~/app/shopapp/.env
```

Paste your database credentials:

```ini
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_SSLMODE=require
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## Part 9 — EC2: Set Up Gunicorn as a Service

> **Why is the file named `flask.service` if we're using Gunicorn?**
> Gunicorn is the actual program running your app — you can see it in the `ExecStart` line below. The service file name (`flask.service`) is just a label you give to the systemd unit; it could be named anything. We name it after the app (Flask) so the `systemctl` commands read naturally (`systemctl restart flask`). The name and the tool are two separate things.

Create the systemd service file:

```bash
sudo nano /etc/systemd/system/flask.service
```

Paste:

```ini
[Unit]
Description=Flask App
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/app/shopapp
Environment="PATH=/home/ec2-user/app/shopapp/venv/bin"
EnvironmentFile=/home/ec2-user/app/shopapp/.env
ExecStart=/home/ec2-user/app/shopapp/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Systemd treats the Flask app like a system service — it starts on reboot, restarts on crash, and runs in the background.

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable flask
sudo systemctl start flask
sudo systemctl status flask
```

Verify it's running on port 5000:

```bash
sudo ss -tlnp | grep 5000
```

---

## Part 10 — EC2: Set Up Nginx

Create the Nginx config:

```bash
sudo nano /etc/nginx/conf.d/shopapp.conf
```

Paste:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name shopapp.duckdns.org;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nginx acts as a reverse proxy — browsers connect to Nginx on port 80/443, and Nginx forwards requests internally to Flask on port 5000.

Open `/etc/nginx/nginx.conf` and check whether there is a default `server { ... }` block inside `http { }`. On Amazon Linux 2023 there usually isn't one — if you don't see it, skip this step. If you do see one, delete it, leaving the `include /etc/nginx/conf.d/*.conf;` line in place.

Test and start Nginx:

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl start nginx
```

- `nginx -t` — Tests the config for syntax errors before applying it
- `systemctl enable` — Makes Nginx start automatically on every reboot
- `systemctl start` — Starts Nginx immediately

---

## Part 11 — EC2: Set Up SSL with Certbot

```bash
sudo certbot --nginx -d shopapp.duckdns.org
```

Certbot will automatically update your Nginx config to add the HTTPS block and redirect HTTP → HTTPS.

> If you get a DNS timeout error, wait a minute and try again — it's an intermittent Let's Encrypt issue with DuckDNS.

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

SSL certificates expire every 90 days. Certbot installs a scheduled renewal task — this dry run confirms it works without actually renewing.

Visit `https://shopapp.duckdns.org` to confirm everything is working.

---

## Redeployment (after code changes)

On your local machine:

```bash
cd shopapp-frontend
npm run build:flask
cd ..
git add .
git commit -m "your message"
git push
```

On EC2:

```bash
cd ~/app/shopapp
git pull
sudo systemctl restart flask
```

---

## Useful Commands

```bash
# Check Flask status
sudo systemctl status flask

# Restart Flask after code changes
sudo systemctl restart flask

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Activate venv manually
source /home/ec2-user/app/shopapp/venv/bin/activate

# Check what is running on port 5000
sudo ss -tlnp | grep 5000
```
