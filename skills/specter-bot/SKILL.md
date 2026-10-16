---
name: specter-bot
description: >
  Telegram ChatOps assistant daemon, server health monitoring, and GitHub Actions notification engine.
  Trigger: /specter-bot, "specter bot", "telegram bot", "bot status", "bot logs", "restart bot", "bot test".
  Do NOT use for editing workflow JSON (use /specter-automa) or cloud database migrations (use /specter-cloud).
argument-hint: "[status|logs|restart|test|run|deploy]"
license: MIT
---

# Specter Telegram Bot & ChatOps (`specter-bot`)

Telegram ChatOps and infrastructure health daemon. Monitors Linux VPS resources, triggers website deployments, and routes GitHub Actions notifications.

## The Ladder

Check state in order:
1. **Daemon Probe**: Check systemd service status (`telegram-bot status` or via SSH port 2222).
2. **Local Test**: Execute native test suite (`pnpm test`).
3. **Log Stream**: Inspect runtime traces (`telegram-bot logs` or `journalctl -u telegram-bot -f`).
4. **Lifecycle Control**: Restart or run foreground debug (`telegram-bot restart`, `telegram-bot run`).
5. **Notification Route**: Dispatch GitHub Actions composite action (`tuquet/bot@main`).

## Commands

```powershell
# 1. Local Testing & Verification
pnpm --prefix bot test

# 2. Remote VPS Daemon Control (via Tuquet Bridge SSH Port 2222)
ssh -p 2222 -o ConnectTimeout=5 root@127.0.0.1 "telegram-bot status"

# 3. Stream Live Daemon Logs
ssh -p 2222 -o ConnectTimeout=5 root@127.0.0.1 "telegram-bot logs"

# 4. Restart Daemon on VPS
ssh -p 2222 -o ConnectTimeout=5 root@127.0.0.1 "telegram-bot restart"

# 5. Direct VPS Execution (On Linux Host)
# telegram-bot status
# telegram-bot restart
# telegram-bot run
```

### GitHub Actions Integration

```yaml
- name: Send Telegram Notification
  if: always()
  uses: tuquet/bot@main
  with:
    bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    status: ${{ job.status }}
    type: 'ci'
```

## Output Contract

Report status strictly:
```text
[TELEGRAM-BOT] Service: <ACTIVE|INACTIVE> (PID: <pid>)
• Role:         ChatOps & Infrastructure Monitoring Daemon
• Target:       Telegram Long-Polling (@FlowupAI_bot)
• Listeners:    <allowed_chat_count> Chats / <admin_count> Admins
• Integrations: GitHub CI Watcher, VPS Stats, SSL Monitor
• Log Source:   ~/telegram-bot/logs/ (systemd journal)
Verdict: Bot active & listening. / Offline: run 'telegram-bot restart'.
```

## Boundaries

Scope: Telegram daemon lifecycle, local test execution, ChatOps command dispatch, and GitHub Actions notification syntax.
- Do NOT expose or commit `TELEGRAM_BOT_TOKEN` in git.
- Do NOT edit Automa workflow JSON (use `/specter-automa`).
- Do NOT run database migrations (use `/specter-cloud`).
- One-shot execution.
