import pino from 'pino';
export default pino.pino({
  level: process.env.LOG_LEVEL ?? 'info'
});
