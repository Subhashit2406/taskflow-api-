/**
 * TaskFlow API - Structured Logger
 * Provides colorized and JSON-friendly logging without heavy external dependencies.
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function formatTimestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (msg, ...args) => {
    if (process.env.NODE_ENV === 'test') return;
    console.log(`${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.green}[INFO]${colors.reset} ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    if (process.env.NODE_ENV === 'test') return;
    console.warn(`${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.error(`${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ${msg}`, ...args);
  },
  http: (msg, ...args) => {
    if (process.env.NODE_ENV === 'test') return;
    console.log(`${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.cyan}[HTTP]${colors.reset} ${msg}`, ...args);
  },
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log(`${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.magenta}[DEBUG]${colors.reset} ${msg}`, ...args);
  }
};

module.exports = logger;
