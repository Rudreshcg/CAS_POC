# SCM Static Backend Deployment Checklist

Use this checklist to fix production `/api/*` 500 errors caused by proxy or backend service issues.

## 1) Prepare backend environment

- Ensure backend path: `/var/www/scm-static/backend`
- Create venv and install dependencies:
  - `python3 -m venv venv`
  - `source venv/bin/activate`
  - `pip install -r requirements.txt`
- Verify `.env` exists at `/var/www/scm-static/backend/.env`

## 2) Install systemd service

- Copy template:
  - `sudo cp /var/www/scm-static/backend/deploy/scm-static-backend.service.example /etc/systemd/system/scm-static-backend.service`
- Reload and enable:
  - `sudo systemctl daemon-reload`
  - `sudo systemctl enable scm-static-backend`
  - `sudo systemctl restart scm-static-backend`
- Check status/logs:
  - `sudo systemctl status scm-static-backend --no-pager`
  - `sudo journalctl -u scm-static-backend -n 200 --no-pager`

## 3) Install nginx site config

- Copy template:
  - `sudo cp /var/www/scm-static/backend/deploy/nginx.scmmax.conf.example /etc/nginx/sites-available/scmmax`
- Enable site:
  - `sudo ln -sf /etc/nginx/sites-available/scmmax /etc/nginx/sites-enabled/scmmax`
- Validate and reload:
  - `sudo nginx -t`
  - `sudo systemctl reload nginx`

## 4) Validate API through nginx

- Health:
  - `curl -i https://scmmax.com/api/health`
- Download request:
  - `curl -i 'https://scmmax.com/api/download-request' -H 'Content-Type: application/json' --data-raw '{"name":"Test","email":"test@business.com"}'`

Expected:
- `Content-Type: application/json`
- `200` for valid business email
- `400` JSON for blocked personal email (example `gmail.com`)

## 5) If still 500

- Check nginx error logs:
  - `sudo tail -n 200 /var/log/nginx/error.log`
- Check backend logs:
  - `sudo journalctl -u scm-static-backend -n 200 --no-pager`
- Check service is listening:
  - `ss -ltnp | rg 8000`

If `/api/health` fails with HTML 500, the issue is nginx/upstream routing or backend service startup, not SMTP logic.
