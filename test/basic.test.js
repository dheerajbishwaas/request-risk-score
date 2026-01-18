const assert = require('assert');
const { analyzeRequest } = require('../src/index');

describe('request-risk-score', () => {

    it('should score low for a browser-like request', () => {
        const req = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml',
                'accept-language': 'en-US,en;q=0.9',
                'upgrade-insecure-requests': '1',
                'host': 'example.com',
                'cookie': 'session_id=12345'
            },
            url: '/',
            ip: '203.0.113.1'
        };

        const result = analyzeRequest(req);
        console.log('Human Score:', result);
        assert.ok(result.score < 40, 'Score should be low for human');
        assert.strictEqual(result.bucket, 'likely_human');
    });

    it('should score medium/high for missing User-Agent', () => {
        const req = {
            headers: {
                'host': 'example.com'
            },
            url: '/',
            ip: '203.0.113.2'
        };
        const result = analyzeRequest(req);
        console.log('Missing UA Score:', result);
        assert.ok(result.score >= 30, 'Score should be elevated for missing UA');
    });

    it('should detect known crawlers and score neutral', () => {
        const req = {
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'host': 'example.com'
            },
            url: '/robots.txt',
            ip: '66.249.64.1'
        };
        const result = analyzeRequest(req); // Crawler
        console.log('Crawler Score:', result);
        assert.ok(result.signals.includes('known_crawler'), 'Should flag crawler');
        assert.ok(result.score <= 20, 'Crawler should be capped low risk');
        assert.strictEqual(result.bucket, 'likely_human');
    });

    it('should penalize rapid requests (Rate Limit)', () => {
        const ip = '203.0.113.3';
        const req = {
            headers: { 'user-agent': 'MyBot' },
            url: '/',
            ip: ip
        };

        // Config default limit is 100/min.
        const opts = { rateLimitMaxRequestPerWindow: 5, rateLimitWindowMs: 1000 };

        for (let i = 0; i < 5; i++) {
            analyzeRequest(req, opts);
        }
        const finalResult = analyzeRequest(req, opts); // 6th request
        console.log('Rate Limit Score:', finalResult);
        assert.ok(finalResult.signals.includes('rate_limit_exceeded'), 'Should detect rate limit');
        assert.ok(finalResult.score >= 70, 'Score should be high');
        assert.strictEqual(finalResult.bucket, 'likely_automated');
    });

    it('should penalize bad User-Agent (curl)', () => {
        const req = {
            headers: {
                'user-agent': 'curl/7.64.1',
                'host': 'example.com'
            },
            url: '/admin/login', // Sensitive Path
            ip: '203.0.113.4'
        };
        const result = analyzeRequest(req);
        console.log('Curl Score:', result);
        assert.ok(result.signals.includes('tool_user_agent'), 'Should detect tool UA');
        assert.ok(result.signals.includes('sensitive_path'), 'Should detect sensitive path');
        assert.ok(result.score >= 50, 'Score should be high');
    });

    it('should detect regular timing (Bot behavior)', () => {
        // ... (existing timing test)
        // Same logic
        const ip = '203.0.113.5';
        const req = { headers: { 'user-agent': 'Bot' }, url: '/', ip };
        for (let i = 0; i < 6; i++) {
            analyzeRequest(req);
        }
        const result = analyzeRequest(req);
        console.log('Timing Variance Score:', result);
        assert.ok(result.signals.includes('regular_request_timing'), 'Should detect regular timing');
    });

});
