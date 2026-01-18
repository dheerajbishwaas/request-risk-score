const { weights, bonuses } = require('../config');

// Simple lists for heuristics
const KNOWN_CRAWLERS = ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot'];
const STANDARD_HEADERS = ['host', 'accept', 'user-agent'];
const BROWSER_LIKE_HEADERS = ['upgrade-insecure-requests', 'accept-language', 'accept-encoding', 'user-agent'];

function getHeadersSignal(req, options) {
    const result = { score: 0, signals: [] };
    const headers = req.headers || {};
    const ua = (headers['user-agent'] || '').toLowerCase();

    // 1. Missing Standard Headers
    const missing = STANDARD_HEADERS.filter(h => !headers[h.toLowerCase()]);
    if (missing.length > 0) {
        result.score += weights.missingStandardHeaders * missing.length;
        result.signals.push(`missing_headers_${missing.join('_')}`);
    }

    // 2. User Agent Checks
    if (!ua) {
        result.score += weights.noUserAgent;
        result.signals.push('no_user_agent');
    } else {
        // Check known crawlers
        const isCrawler = KNOWN_CRAWLERS.some(bot => ua.includes(bot));
        if (isCrawler) {
            // Neutral - no penalty
            result.signals.push('known_crawler');
        } else {
            // If not a crawler, check for bad patterns (e.g. 'curl')
            if (ua.includes('curl') || ua.includes('python-requests') || ua.includes('wget')) {
                result.score += weights.badUserAgent;
                result.signals.push('tool_user_agent');
            }
        }
    }

    // 3. Positive Signals (Browser Like)
    // If it has all the "Browser Like" headers and IS NOT a tool UA
    const hasAllBrowserHeaders = BROWSER_LIKE_HEADERS.every(h => headers[h]);
    if (hasAllBrowserHeaders && !result.signals.includes('tool_user_agent') && !result.signals.includes('no_user_agent')) {
        result.score -= bonuses.standardHeadersPresent;
    }

    return result;
}

module.exports = { getHeadersSignal };
