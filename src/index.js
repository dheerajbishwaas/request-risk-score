const { calculateRiskScore } = require('./scorer');
const config = require('./config');

/**
 * Analyze an HTTP request and return a risk score.
 * @param {Object} req - Node.js HTTP request object (or Express/Fastify req)
 * @param {Object} [options] - Configuration options
 * @returns {Object} { score: number, bucket: string, signals: string[] }
 */
function analyzeRequest(req, options) {
    return calculateRiskScore(req, options);
}

module.exports = {
    analyzeRequest,
    defaults: config.defaults
};
