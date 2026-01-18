# request-risk-score

A privacy-respecting, lightweight Node.js package to analyze HTTP requests and calculate a risk score (0-100) indicating the likelihood of the request being a bot or automated script.

**Features:**
*   🚀 **Lightweight**: Zero runtime dependencies (mostly).
*   🔒 **Privacy Needed**: No external APIs, no browser fingerprinting, no PII logging.
*   🧠 **Probabilistic**: Returns a score, not a binary "block/allow".
*   ⚡ **Performance**: In-memory caching and efficient heuristics.

## Installation

```bash
npm install request-risk-score
```

## Usage

```javascript
const { analyzeRequest } = require('request-risk-score');

// In your request handler (Express, HTTP, etc.)
app.use((req, res, next) => {
  const risk = analyzeRequest(req);
  
  if (risk.bucket === 'high') {
    console.log(`Blocked suspicious request from ${risk.ip}. Score: ${risk.score}`);
    console.log('Signals:', risk.signals);
    return res.status(403).send('Request verification failed.');
  }

  // Add risk info to request for downstream logic
  req.risk = risk;
  next();
});
```

### Response Object
```json
{
  "score": 78,
  "bucket": "high",
  "signals": [
    "no_user_agent",
    "rate_limit_exceeded",
    "regular_request_timing"
  ],
  "ip": "203.0.113.10"
}
```

## Decision Buckets
| Score | Bucket | Recommendation |
|-------|--------|----------------|
| 0-39  | `likely_human`    | Likely Human. Allow. |
| 40-69 | `suspicious` | Suspicious. Monitor or CAPTCHA? |
| 70-100| `likely_automated`   | Likely Bot. Block or Challenge. |

## Configuration
You can pass an options object to `analyzeRequest`:
```javascript
const options = {
  enableTorCheck: false, // Default: false (requires external list)
  rateLimitWindowMs: 60000, 
  rateLimitMaxRequestPerWindow: 100,
  ip: req.ip // Manually pass IP if using proxy
};
const result = analyzeRequest(req, options);
```

## Signals Analyzed
1.  **Network**: Bogus IPs, IPs that look local (in production context).
2.  **Headers**: Missing standard headers, bad User-Agent patterns (curl, wget), presence of browser-specific headers.
3.  **Behavior**: 
    *   **Rate Limiting**: Sliding window counter.
    *   **Path Entropy**: Detects random scanning paths (e.g. `/admin/w8x7e9...`).
    *   **Sensitive Paths**: Flags access to known protected paths (e.g. `/admin`, `/login`).
    *   **Timing Variance**: Detects perfectly regular intervals (bot-like) vs irregular human timing.
4.  **Session**: Cookie presence (weak signal).

## ⚠️ Limitations & Disclaimers
*   **Probability != Certainty**: A score of 0 does not guarantee a human, and 100 does not guarantee a malicious bot.
*   **In-Memory State**: Rate limiting and timing analysis are stored in memory. This package is **not stateful across cluster/serverless** instances unless sticky sessions are used.
*   **Privacy**: This package does **not** track users across sites. It only analyzes the current request context.
*   **Tor**: Tor exit node detection is disabled by default to avoid stale bundled lists.

## License
ISC
