const mongoose = require('mongoose');

/** @type {boolean | null} */
let transactionsSupported = null;

/**
 * @param {unknown} err
 */
function isTransactionNotSupported(err) {
    const message = err instanceof Error ? err.message : String(err);

    return message.includes('replica set')
        || message.includes('mongos')
        || message.includes('Transaction numbers are only allowed');
}

/**
 * @returns {Promise<boolean>}
 */
async function supportsTransactions() {
    if (transactionsSupported !== null) {
        return transactionsSupported;
    }

    if (mongoose.connection.readyState !== 1) {
        transactionsSupported = false;
        return false;
    }

    if (process.env.GOLAZO_DISABLE_TRANSACTIONS === 'true') {
        transactionsSupported = false;
        return false;
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {});
        transactionsSupported = true;
    } catch (err) {
        transactionsSupported = !isTransactionNotSupported(err);
    } finally {
        await session.endSession();
    }

    return transactionsSupported;
}

/**
 * Run work inside a MongoDB transaction when the deployment supports it.
 * Falls back to running without a session on standalone MongoDB.
 *
 * @template T
 * @param {(session: import('mongoose').ClientSession | null) => Promise<T>} work
 * @returns {Promise<T>}
 */
async function runWithTransaction(work) {
    const canTransact = await supportsTransactions();

    if (!canTransact) {
        return work(null);
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            result = await work(session);
        });

        return result;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    runWithTransaction,
    supportsTransactions,
    isTransactionNotSupported,
};