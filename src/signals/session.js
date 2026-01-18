const { weights } = require('../config');

function getSessionSignal(req, options) {
    const result = { score: 0, signals: [] };
    const headers = req.headers || {};

    // 1. Cookie Presence
    // Lack of cookies is suspicious for an authenticated session but normal for API.
    // We only flag if we expect a user session? 
    // The goal is "Session Signals".
    // If "No cookies" -> small risk?
    const cookie = headers['cookie'];
    if (!cookie) {
        result.score += weights.noCookies;
        result.signals.push('no_cookies');
    } else {
        // Maybe check for length?
        if (cookie.length < 10) {
            // malformed or empty-ish
        }
    }

    return result;
}

module.exports = { getSessionSignal };
