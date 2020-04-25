'use strict';

const logger = require('winston');

const levels = ['error', 'info', 'debug', 'silly'];

/**
 * @param {*} verbositiy 0 (error) to 3 (silly)
 */
function initializeLogger(verbositiy) {
    const level = (verbositiy < levels.length) ? levels[verbositiy] : levels[level.length-1];
    logger.configure({
        level: level,
        format: logger.format.combine(
            logger.format.colorize(),
            logger.format.splat(),
            logger.format.simple()
        ),
        transports: [
            new logger.transports.Console()
        ],
        exitOnError: false
    });
};
exports.initializeLogger = initializeLogger;

// start with log level error
initializeLogger(0);
