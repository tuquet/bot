#!/usr/bin/env bash
# ==============================================================================
# Flowup Bot - Self-Contained Uninstaller
# ==============================================================================
set -e

SERVICE_NAME="flowup-bot"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
BIN_LINK="/usr/local/bin/flowup-bot"

echo "===================================================="
echo "Uninstalling Flowup Bot Daemon..."
echo "===================================================="

# 1. Stop and disable systemd service
if systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "-> Stopping service $SERVICE_NAME..."
  systemctl stop "$SERVICE_NAME"
fi

if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
  echo "-> Disabling service $SERVICE_NAME..."
  systemctl disable "$SERVICE_NAME"
fi

# 2. Remove service file
if [ -f "$SERVICE_FILE" ]; then
  echo "-> Removing $SERVICE_FILE..."
  rm -f "$SERVICE_FILE"
  systemctl daemon-reload
fi

# 3. Remove global symlink
if [ -L "$BIN_LINK" ] || [ -f "$BIN_LINK" ]; then
  echo "-> Removing symlink $BIN_LINK..."
  rm -f "$BIN_LINK"
fi

echo ""
echo "===================================================="
echo "Flowup Bot uninstalled successfully."
echo "Application directory and logs have been preserved."
echo "===================================================="
