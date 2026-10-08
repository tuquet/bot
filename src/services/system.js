import os from 'os';
import tls from 'tls';
import { URL } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config.js';

const execAsync = promisify(exec);

/**
 * Format bytes to readable string (GB, MB)
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format uptime seconds to human-readable string
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(' ') || '< 1m';
}

/**
 * Get VPS system statistics (CPU, RAM, Disk, Uptime)
 */
export async function getSystemStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

  const loadAvg = os.loadavg().map(l => l.toFixed(2));
  const cpus = os.cpus().length;
  const uptimeStr = formatUptime(os.uptime());

  let diskInfo = 'N/A';
  try {
    const { stdout } = await execAsync("df -h / | awk 'NR==2 {print $2, $3, $4, $5}'");
    const [total, used, avail, pcent] = stdout.trim().split(/\s+/);
    diskInfo = `${used} / ${total} (${pcent} used, ${avail} free)`;
  } catch (err) {
    diskInfo = 'Error reading disk';
  }

  return {
    cpus,
    loadAvg: `${loadAvg[0]}, ${loadAvg[1]}, ${loadAvg[2]}`,
    memory: `${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${memUsagePercent}%)`,
    disk: diskInfo,
    uptime: uptimeStr,
    platform: `${os.type()} ${os.arch()}`
  };
}

/**
 * Check SSL certificate expiry in days
 */
function getSslCertDays(host, port = 443) {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        { host, port, servername: host, timeout: 5000 },
        () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (cert && cert.valid_to) {
            const expiry = new Date(cert.valid_to);
            const now = new Date();
            const daysRemaining = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
            resolve(daysRemaining);
          } else {
            resolve(null);
          }
        }
      );
      socket.on('error', () => resolve(null));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(null);
      });
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Check website latency, status and SSL
 */
export async function checkSiteHealth(targetUrl = config.websiteUrl) {
  const parsed = new URL(targetUrl);
  const startTime = Date.now();

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'FlowupAI-Monitor/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    const latency = Date.now() - startTime;
    
    let sslDays = null;
    if (parsed.protocol === 'https:') {
      sslDays = await getSslCertDays(parsed.hostname, parsed.port || 443);
    }

    return {
      url: targetUrl,
      status: response.status,
      statusText: response.statusText,
      latency,
      sslDays,
      isOk: response.ok
    };
  } catch (error) {
    return {
      url: targetUrl,
      status: 0,
      statusText: error.message,
      latency: Date.now() - startTime,
      sslDays: null,
      isOk: false
    };
  }
}

/**
 * Check status of systemd services
 */
export async function checkServices(serviceList = config.monitoredServices) {
  const results = [];
  const safeNameRegex = /^[a-zA-Z0-9_\-\.@]+$/;
  for (const name of serviceList) {
    if (!name || typeof name !== 'string' || !safeNameRegex.test(name)) {
      results.push({ name: String(name), status: 'invalid_name', active: false });
      continue;
    }
    try {
      const { stdout } = await execAsync(`systemctl is-active ${name} || true`);
      const status = stdout.trim();
      results.push({ name, status, active: status === 'active' });
    } catch (err) {
      results.push({ name, status: 'error', active: false });
    }
  }
  return results;
}
