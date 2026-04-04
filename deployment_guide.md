# Medicata Deployment Guide

This guide provides step-by-step instructions for running the Medicata backend and configuring Nginx for production-like environments.

## 1. Prerequisites
- **Rust (Stable)**: To compile and run the Axum server.
- **PostgreSQL**: To host the application data.
- **Nginx**: For reverse proxying and SSL termination.
- **Node.js (for Landing Page)**: To build the Vite project.

---

## 2. Running the Backend Server

### Step A: Configuration
Ensure your `.env` file in the `server/` directory is correctly configured:
```dotenv
DATABASE_URL=postgres://<user>:<password>@localhost:5432/medicata
JWT_SECRET=your_secure_random_string_here
PORT=3000
RUST_LOG=info
```

### Step B: Database Initialization
If you haven't already, initialize the database using the provided schema:
```bash
psql -U postgres -d medicata -f db/schema.sql
```

### Step C: Build and Run
Use Release mode for production performance:
```bash
cd server
cargo run --release
```
The server will start on `http://127.0.0.1:3000`.

---

## 3. Building the Landing Page
```bash
cd landing-page
npm install
npm run build
```
This will generate the `dist` folder, which Nginx will serve.

---

## 4. Nginx Configuration

Create a new Nginx configuration file (e.g., `/etc/nginx/sites-available/medicata`):

### Nginx Config for `medicata.ng` (Landing Page) & `api.medicata.ng` (API)

```nginx
# 1. API Subdomain (api.medicata.ng)
server {
    listen 80;
    server_name api.medicata.ng;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Main Domain (medicata.ng)
server {
    listen 80;
    server_name medicata.ng;

    root /home/amee/Desktop/medicata/landing-page/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Cache control for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

### Step D: Enable the configuration
```bash
sudo ln -s /etc/nginx/sites-available/medicata /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Security Recommendations
- **SSL**: Use Certbot to enable HTTPS for both domains:
  ```bash
  sudo certbot --nginx -d medicata.ng -d api.medicata.ng
  ```
- **Firewall**: Ensure only HTTP (80) and HTTPS (443) are open to the public; keep port 3000 internal.

---

## 6. Verification
Once Nginx is configured:
- Visit `https://medicata.ng` to see the landing page.
- Test the API via `https://api.medicata.ng/api/auth/register`.
