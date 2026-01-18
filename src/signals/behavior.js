const { weights, defaults } = require('../config');
const { calculateEntropy } = require('../utils/entropy');
const { calculateTimingVariance } = require('../utils/timing');

const store = new Map();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 min

// Excluded paths for entropy
const LOW_ENTROPY_PATHS = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];

function runRateLimit(ip, options) {
    const now = Date.now();
    const windowMs = options.rateLimitWindowMs || defaults.rateLimitWindowMs;
    const limit = options.rateLimitMaxRequestPerWindow || defaults.rateLimitMaxRequestPerWindow;

    // 1. Global Cleanup (Lazy)
    if (now - lastCleanup > CLEANUP_INTERVAL) {
        for (const [key, timestamps] of store.entries()) {
            // Remove if verify last timestamp is older than window
            if (timestamps.length === 0 || (now - timestamps[timestamps.length - 1] > windowMs)) {
                store.delete(key);
            }
        }
        lastCleanup = now;
    }

    // 2. IP Specific Logic
    let timestamps = store.get(ip) || [];

    // Prune old
    timestamps = timestamps.filter(t => now - t <= windowMs);

    // Check Limit
    const isRateLimited = timestamps.length >= limit;

    // Add new (if not blocked? or always add to track burst?)
    // We'll add it.
    timestamps.push(now);

    // Safety cap: don't let it grow infinitely if under attack
    if (timestamps.length > limit * 2) {
        timestamps = timestamps.slice(-limit * 2);
    }

    store.set(ip, timestamps);

    // Return result
    if (isRateLimited) {
        return { score: weights.rateLimitExceeded, signal: 'rate_limit_exceeded' };
    }
    return null;
}

function getBehaviorSignal(req, ip, options) {
    const result = { score: 0, signals: [] };
    let timestamps = [];

    // 1. Rate Limiting
    if (ip) {
        const rlResult = runRateLimit(ip, options);
        // We need to retrieve timestamps from the store to check variance
        // Since runRateLimit updates it.
        timestamps = store.get(ip) || [];

        if (rlResult) {
            result.score += rlResult.score;
            result.signals.push(rlResult.signal);
        }
    }

    // 2. Path Entropy & Sensitive Checker
    const url = req.url || '';

    // Check Sensitive
    // Need to access options/defaults for list
    const sensitivePaths = options.sensitivePaths || defaults.sensitivePaths || [];
    if (sensitivePaths.some(path => url.startsWith(path))) {
        result.score += weights.sensitivePath;
        result.signals.push('sensitive_path');
    }

    // Only check entropy if not in exclude list
    if (!LOW_ENTROPY_PATHS.includes(url) && !url.startsWith('/assets')) {
        const entropy = calculateEntropy(url);
        // Threshold? 
        // Standard english text ~3-4. Random UUID ~4.5+. 
        // Long random paths usually > 5.
        if (entropy > 5.5) { // tuned somewhat high
            result.score += weights.highPathEntropy;
            result.signals.push('high_path_entropy');
        }
    }

    // 3. Timing Variance (Session Signal implemented here efficiently)
    // Check variance if we have enough data (e.g., > 5 requests)
    if (timestamps.length >= 5) {
        const variance = calculateTimingVariance(timestamps);
        // Low variance = Bot-like (e.g. < 100 on raw ms might be too strict?)
        // Heuristic: Variance < 50 (ms^2) is very regular.
        if (variance < 50) {
            result.score += weights.timingIrregularity; // Re-using weight name
            result.signals.push('regular_request_timing');
        }
    }

    return result;
}

module.exports = { getBehaviorSignal };
