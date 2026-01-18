const { getNetworkSignal } = require('./signals/network');
const { getHeadersSignal } = require('./signals/headers');
const { getBehaviorSignal } = require('./signals/behavior');
const { getSessionSignal } = require('./signals/session');
const { defaults } = require('./config');

function calculateRiskScore(req, options = {}) {
    // Merge options with defaults
    const opts = { ...defaults, ...options };

    // Extract common fields
    // Support standard Node.js req check or Express/NestJS properties
    const ip = options.ip || req.ip || req.socket?.remoteAddress || '';

    let score = 0;
    let signals = [];

    // 1. Network Signals
    const network = getNetworkSignal(ip, opts);
    score += network.score;
    signals.push(...network.signals);

    // 2. Headers Signals
    const headers = getHeadersSignal(req, opts);
    score += headers.score;
    signals.push(...headers.signals);

    // 3. Behavior Signals (Rate limit, Entropy, Timing)
    const behavior = getBehaviorSignal(req, ip, opts);
    score += behavior.score;
    signals.push(...behavior.signals);

    // 4. Session Signals (Cookie)
    const session = getSessionSignal(req, opts);
    score += session.score;
    signals.push(...session.signals);

    // 5. Scoring Adjustments & Rules

    // Rule: Known Crawler Cap
    // If 'known_crawler' signal exists, cap the score at 20 (likely_human)
    // regardless of missing headers or no cookies.
    if (signals.includes('known_crawler')) {
        if (score > 20) score = 20;
        // We still keep the signals for explanation, but force score down.
    }

    // Normalization / Clamping
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    // Decision Buckets
    let bucket = 'likely_human';
    if (score >= 70) bucket = 'likely_automated';
    else if (score >= 40) bucket = 'suspicious';
    else bucket = 'likely_human'; // 0-39

    return {
        score,
        bucket,
        signals,
        ip // echo back ip used
    };
}

module.exports = { calculateRiskScore };
