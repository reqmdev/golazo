require('colors');
const fs = require('fs');
const { appPath } = require('./appRoot');

const useJsonLogs = process.env.GOLAZO_LOG_FORMAT === 'json';
const logStream = fs.createWriteStream(appPath('terminal.log'), { flags: 'a' });

/**
 * @param {string} line
 */
function appendLog(line) {
    logStream.write(`${line}\n`);
}

/**
 * @param {'info' | 'success' | 'error' | 'warn'} level
 * @param {string[]} message
 */
function writeLog(level, message) {
    const text = message.join(' ');

    if (useJsonLogs) {
        const payload = JSON.stringify({
            time: new Date().toISOString(),
            level,
            message: text,
        });

        if (level === 'error') {
            console.error(payload);
        } else if (level === 'warn') {
            console.warn(payload);
        } else {
            console.log(payload);
        }

        appendLog(payload);
        return;
    }

    const time = new Date().toLocaleTimeString();
    const label = level === 'success'
        ? '[OK]'.green
        : level === 'error'
            ? '[Error]'.red
            : level === 'warn'
                ? '[Warning]'.yellow
                : '[Info]'.blue;

    const rendered = [`[${time}]`.gray, label, text].join(' ');
    const plain = rendered.replace(/\u001b\[[0-9;]*m/g, '');

    if (level === 'error') {
        console.error(rendered);
    } else if (level === 'warn') {
        console.warn(rendered);
    } else {
        console.info(rendered);
    }

    appendLog(plain);
}

/**
 * @param {string[]} message
 */
const info = (...message) => writeLog('info', message);

/**
 * @param {string[]} message
 */
const success = (...message) => writeLog('success', message);

/**
 * @param {string[]} message
 */
const error = (...message) => writeLog('error', message);

/**
 * @param {string[]} message
 */
const warn = (...message) => writeLog('warn', message);

module.exports = { info, success, error, warn };