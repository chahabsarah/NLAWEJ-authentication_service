
const winston = require('winston');


const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
    }),
  ],
});

const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      logger.error(err.stack);
    } else {
      logger.error(err.message);
    }

    res.status(err.status || 500).json({
      message: 'An unexpected error occurred. Please try again later.',
      stack: process.env.NODE_ENV === 'development' ? err.stack : null,
    });
  };

module.exports = { logger, errorHandler };