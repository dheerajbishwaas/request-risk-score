const { analyzeRequest } = require('./src/index');

// specific options
const options = {
    // You can customize strictness
    strictMode: true
};

/* --------------------------------------------------
   TEST 1: Normal Browser Request
-------------------------------------------------- */
console.log('--- TEST 1: Normal Browser Request ---');

const goodReq = {
  ip: '192.168.1.10',
  headers: {
    host: 'mysite.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.85',
    accept: 'text/html,application/xhtml+xml',
    'accept-language': 'en-US',
    'upgrade-insecure-requests': '1',
    cookie: 'session=xyz'
  },
  url: '/home'
};

console.log(analyzeRequest(goodReq, options));


/* --------------------------------------------------
   TEST 2: Suspicious Bot (curl hitting sensitive path)
-------------------------------------------------- */
console.log('\n--- TEST 2: Suspicious Bot (Curl) ---');

const badReq = {
  ip: '10.0.0.5',
  headers: {
    host: 'mysite.com',
    'user-agent': 'curl/7.68.0'
  },
  url: '/admin/login'
};

console.log(analyzeRequest(badReq, options));


/* --------------------------------------------------
   TEST 3: Known Search Engine Crawler (Bingbot)
-------------------------------------------------- */
console.log('\n--- TEST 3: Crawler (Bingbot) ---');

const crawlerReq = {
  ip: '40.77.167.1',
  headers: {
    host: 'mysite.com',
    'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
  },
  url: '/robots.txt'
};

console.log(analyzeRequest(crawlerReq, options));