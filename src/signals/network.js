const { weights } = require('../config');

// Basic private/bogus ranges
// 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.168.0.0/16, ::1
// For "Sanity", we mainly care if the IP looks malformed or is clearly non-routable in a way that suggests spoofing or internal leak context where it shouldn't be.
// However, for a generic package, local IPs might be valid (dev mode). we should only flag strictly BOGUS IPs if possible, or leave it lenient.
// The user request said "Local/bogus IP detection".
// Let's flag 0.0.0.0 and Loopback as potentially 'local' but maybe not 'risk' unless inconsistent. 
// Actually, usually 127.0.0.1 in production headers might mean a proxy setup issue OR spoofing.
// Let's stick to checking if it is a valid public IP vs private.

// For now, simple check.
function getNetworkSignal(ip, options) {
    const result = { score: 0, signals: [] };

    if (!ip) return result; // Should have handled missing IP earlier or ignore

    // Check for Bogus / Unspecified
    // Check for Bogus / Unspecified
    if (ip === '0.0.0.0' || ip === '::') {
        result.score += weights.ipSanity;
        result.signals.push('ip_unspecified');
        return result; // Return early for total bogus
    }

    // Check Private IPs (RFC 1918)
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    const isPrivate = ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        (ip.startsWith('172.') && parseInt(ip.split('.')[1], 10) >= 16 && parseInt(ip.split('.')[1], 10) <= 31);

    if (isPrivate) {
        result.signals.push('private_ip');
    }

    // Check Localhost
    if (ip === '127.0.0.1' || ip === '::1') {
        // Localhost
        result.signals.push('ip_localhost');
        result.score += 20;
    }

    return result;
}

module.exports = { getNetworkSignal };
