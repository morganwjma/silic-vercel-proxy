const https = require('https');

// 關閉 Vercel 預設的 Body 解析器，讓檔案的二進制串流能原封不動地通過
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // 開放 CORS 讓你的 App 可以順利讀取
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 組合前往 SILIC 的請求
  const options = {
    hostname: 'silic.tbn.org.tw',
    port: 443,
    path: '/upload',
    method: 'POST',
    headers: {
      ...req.headers,
      host: 'silic.tbn.org.tw' // 覆寫 Host 避免被防火牆阻擋
    },
    // ★ 強制忽略 SILIC 殘缺的 SSL 憑證
    rejectUnauthorized: false
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 500);
    Object.keys(proxyRes.headers).forEach((key) => {
      if (proxyRes.headers[key]) {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    res.status(500).json({ error: e.message });
  });

  req.pipe(proxyReq, { end: true });
}
