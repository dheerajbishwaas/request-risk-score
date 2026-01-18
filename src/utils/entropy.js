/**
 * Calculate Shannon Entropy of a string.
 * High entropy indicates value is random/encrypted/hashed.
 * Low entropy indicates standard vocab/words.
 * @param {string} str 
 * @returns {number} Entropy value
 */
function calculateEntropy(str) {
    if (!str) return 0;

    const len = str.length;
    const frequencies = {};

    for (let i = 0; i < len; i++) {
        const char = str[i];
        frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}

module.exports = { calculateEntropy };
