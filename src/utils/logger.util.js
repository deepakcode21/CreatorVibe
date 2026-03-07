// Console mein sahi se logs dikhane ke liye

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

const getTime = () => {
  return new Date().toLocaleTimeString("en-IN");
};

export const logger = {
  info: (message, ...args) => {
    console.log(`${colors.green}[INFO]${colors.reset} ${colors.gray}${getTime()}${colors.reset} ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.log(`${colors.red}[ERROR]${colors.reset} ${colors.gray}${getTime()}${colors.reset} ${message}`, ...args);
  },

  warn: (message, ...args) => {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${colors.gray}${getTime()}${colors.reset} ${message}`, ...args);
  },

  debug: (message, ...args) => {
    console.log(`${colors.blue}[DEBUG]${colors.reset} ${colors.gray}${getTime()}${colors.reset} ${message}`, ...args);
  },
};