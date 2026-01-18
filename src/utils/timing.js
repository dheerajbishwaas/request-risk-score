/**
 * Calculate variance of time intervals between requests.
 * @param {Array<number>} timestamps - Array of timestamps (ms)
 * @returns {number} Variance (or Infinity if not enough data)
 */
function calculateTimingVariance(timestamps) {
    if (!timestamps || timestamps.length < 3) return Infinity; // Need at least 3 points for 2 intervals

    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    // Calculate Mean Interval
    const n = intervals.length;
    const mean = intervals.reduce((a, b) => a + b, 0) / n;

    // Calculate Variance
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;

    return variance;
}

module.exports = { calculateTimingVariance };
