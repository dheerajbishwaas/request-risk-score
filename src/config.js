module.exports = {
  defaults: {
    enableTorCheck: false, // Default off as per plan
    rateLimitWindowMs: 60000, // 1 minute
    rateLimitMaxRequestPerWindow: 100, // Just a baseline default
    strictMode: false, // If true, weights might be higher
    sensitivePaths: ['/admin', '/login', '/dashboard', '/api/users', '/root', '/.env'], // Paths to handle with extra strictness
  },
  weights: {
    // Network
    ipSanity: 100, // Strong signal (bogus IP)

    // Headers
    missingStandardHeaders: 10,
    badUserAgent: 40,
    noUserAgent: 30,

    // Behavior 
    // Rate limit score is dynamic usually, but can have a base weight
    rateLimitExceeded: 80,
    highPathEntropy: 20,
    sensitivePath: 20, // New weight for accessing sensitive areas

    // Session
    noCookies: 5, // Weak signal alone
    timingIrregularity: 20
  },
  // Negative scores (Sanity bonuses)
  bonuses: {
    standardHeadersPresent: 10,
    knownCrawler: 0 // Neutral
  }
};
