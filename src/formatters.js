import { InlineKeyboard } from 'grammy';
import { config } from './config.js';
import { getMultiRepoCiSummary, getLatestRuns } from './services/github.js';
import { getSystemStats, checkSiteHealth } from './services/system.js';
import { getLatestReleases } from './services/releases.js';

// Escape HTML special characters
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Helper to create main keyboard
export function getMainKeyboard() {
  return new InlineKeyboard()
    .text('📊 CI Status', 'action:ci')
    .text('🚀 Deploy Website', 'action:deploy_confirm')
    .row()
    .text('🌐 Site Health', 'action:site')
    .text('💻 Server VPS', 'action:server')
    .row()
    .text('📦 Releases', 'action:releases')
    .text('📂 Repos', 'action:repos')
    .row()
    .text('📜 Error Logs', 'action:logs');
}

// Format Multi-Repo CI Overview Message
export async function formatMultiRepoCiMessage() {
  const list = await getMultiRepoCiSummary(config.monitoredRepos);
  const rows = list.map(item => {
    const shortName = item.repo.replace(/^tuquet\//, '');
    if (!item.hasRun) {
      return `⚪ <b>${escapeHtml(shortName)}:</b> <i>chưa có workflow</i>`;
    }
    const emoji = item.conclusion === 'success' ? '🟢' : item.conclusion === 'failure' ? '🔴' : '🔄';
    const statusStr = item.conclusion || item.status;
    return `${emoji} <b><a href="${escapeHtml(item.url)}">${escapeHtml(shortName)}</a>:</b> <code>${escapeHtml(statusStr)}</code> (<i>${escapeHtml(item.workflowName)}</i>)`;
  });

  const text = [
    `<b>📊 Tổng Quan CI/CD Hệ Sinh Thái Repositories:</b>`,
    ``,
    rows.join('\n'),
    ``,
    `<i>Gõ <code>/ci &lt;tên_repo&gt;</code> để xem chi tiết hoặc <code>/logs &lt;tên_repo&gt;</code> để lấy log lỗi.</i>`
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .text('🔄 Làm mới', 'action:ci_all')
    .row()
    .text('🔙 Menu chính', 'action:help');

  return { text, keyboard };
}

// Format CI Status Message
export async function formatCiMessage(repo = config.defaultRepo) {
  const runs = await getLatestRuns(repo, 1);
  if (!runs || runs.length === 0) {
    return {
      text: `⚠️ Không tìm thấy workflow run nào cho repo <code>${escapeHtml(repo)}</code>.`,
      keyboard: new InlineKeyboard().text('🌐 Xem tất cả Repos', 'action:ci_all').row().text('🔙 Menu chính', 'action:help')
    };
  }

  const run = runs[0];
  let statusEmoji = '⏳';
  if (run.status === 'completed') {
    statusEmoji = run.conclusion === 'success' ? '✅' : '❌';
  } else if (run.status === 'in_progress') {
    statusEmoji = '🔄';
  }

  const sha = run.headSha ? run.headSha.substring(0, 7) : 'unknown';
  const createdAt = new Date(run.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const text = [
    `<b>📊 GitHub Actions Status</b>`,
    `📂 <b>Repo:</b> <code>${escapeHtml(repo)}</code>`,
    `⚙️ <b>Workflow:</b> ${escapeHtml(run.workflowName)}`,
    `📌 <b>Trạng thái:</b> ${statusEmoji} <b>${escapeHtml(run.conclusion || run.status)}</b>`,
    `🌿 <b>Nhánh:</b> <code>${escapeHtml(run.headBranch)}</code> (<code>${sha}</code>)`,
    `🎯 <b>Event:</b> <code>${escapeHtml(run.event)}</code>`,
    `🕒 <b>Thời gian:</b> ${createdAt}`,
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .url('🔗 Xem trên GitHub', run.url || `https://github.com/${repo}/actions`)
    .text('🔄 Làm mới', `action:ci:${repo}`)
    .row()
    .text('🌐 Xem tất cả Repos', 'action:ci_all')
    .row()
    .text('🔙 Menu chính', 'action:help');

  return { text, keyboard };
}

// Format Server Stats Message
export async function formatServerMessage() {
  const stats = await getSystemStats();
  const text = [
    `<b>💻 Thông Tin Máy Chủ VPS</b>`,
    `⚡ <b>CPU:</b> ${stats.cpus} cores (Load: <code>${stats.loadAvg}</code>)`,
    `🧠 <b>RAM:</b> <code>${stats.memory}</code>`,
    `💾 <b>Ổ cứng (/):</b> <code>${stats.disk}</code>`,
    `⏱️ <b>Uptime:</b> ${stats.uptime}`,
    `🐧 <b>Hệ điều hành:</b> <code>${stats.platform}</code>`,
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .text('🔄 Cập nhật', 'action:server')
    .text('🔍 Services', 'action:services')
    .row()
    .text('🔙 Menu chính', 'action:help');

  return { text, keyboard };
}

// Format Site Health Message
export async function formatSiteMessage(url = config.websiteUrl) {
  const health = await checkSiteHealth(url);
  const statusEmoji = health.isOk ? '✅' : '❌';
  const sslText = health.sslDays !== null ? `${health.sslDays} ngày` : 'N/A';

  const text = [
    `<b>🌐 Kiểm Tra Website Health</b>`,
    `🔗 <b>URL:</b> ${escapeHtml(health.url)}`,
    `📡 <b>Status:</b> ${statusEmoji} <code>${health.status} ${escapeHtml(health.statusText)}</code>`,
    `⚡ <b>Độ trễ:</b> <code>${health.latency} ms</code>`,
    `🔒 <b>Chứng chỉ SSL:</b> Còn <b>${sslText}</b>`,
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .url('🌍 Mở Website', health.url)
    .text('🔄 Đo lại', 'action:site')
    .row()
    .text('🔙 Menu chính', 'action:help');

  return { text, keyboard };
}

// Format Releases Message
export async function formatReleasesMessage() {
  const releases = await getLatestReleases(5);
  if (!releases || releases.length === 0) {
    return {
      text: '⚠️ Không thể tải danh sách releases từ portal.',
      keyboard: new InlineKeyboard().text('🔙 Menu chính', 'action:help')
    };
  }

  const lines = releases.map((r, i) => {
    const date = new Date(r.createdAt).toLocaleDateString('vi-VN');
    return `${i + 1}. <b><a href="${escapeHtml(r.url)}">${escapeHtml(r.repo)}</a></b> (<code>${escapeHtml(r.version)}</code>) - <i>${date}</i>\n   ${escapeHtml(r.title)}`;
  });

  const text = [
    `<b>📦 Danh Sách Releases Gần Đây:</b>`,
    `📡 <i>Nguồn: <a href="${escapeHtml(config.releasesFeedUrl)}">tuquet.netlify.app/feed.xml</a></i>`,
    ``,
    lines.join('\n\n')
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .url('🌐 Mở Releases Portal', 'https://tuquet.netlify.app/')
    .text('🔄 Làm mới', 'action:releases')
    .row()
    .text('🔙 Menu chính', 'action:help');

  return { text, keyboard };
}
