#!/usr/bin/env bash
# ==============================================================================
# Flowup Bot - Self-Contained Installer
# ==============================================================================
set -e

APP_DIR="/root/flowup-bot"
SERVICE_NAME="flowup-bot"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
BIN_LINK="/usr/local/bin/flowup-bot"

echo "===================================================="
echo "Installing Flowup Bot Daemon..."
echo "===================================================="

cd "$APP_DIR"

# 1. Ensure executable permissions
chmod +x "$APP_DIR/bin/flowup-bot"
chmod +x "$APP_DIR/install.sh"
chmod +x "$APP_DIR/uninstall.sh"

# 2. Install pnpm dependencies
echo "-> Installing dependencies via pnpm..."
pnpm install --prod

# 3. Create global symlink
echo "-> Creating global symlink in /usr/local/bin/flowup-bot..."
ln -sf "$APP_DIR/bin/flowup-bot" "$BIN_LINK"

# 4. Resolve Node path and PATH
NODE_BIN=$(which node || echo "/usr/bin/node")
ENV_PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# 5. Write systemd unit file
echo "-> Configuring systemd service at $SERVICE_FILE..."
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Flowup Telegram Bot Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=$NODE_BIN src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PATH=$ENV_PATH

[Install]
WantedBy=multi-user.target
EOF

# 6. Reload and start systemd service
echo "-> Reloading systemd and enabling service..."
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo ""
echo "===================================================="
echo "Flowup Bot installation completed successfully!"
echo "Check status using: flowup-bot status"
echo "View live logs using: flowup-bot logs"
echo "===================================================="
