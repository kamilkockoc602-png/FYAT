const Busboy = require('busboy');
const xlsx = require('node-xlsx').default;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const bb = new Busboy({ headers: event.headers });
  let buffers = [], username = 'guest';

  return new Promise((resolve) => {
    bb.on('field', (name, val) => {
      if (name === 'username') username = val;
    });
    bb.on('file', (name, file) => {
      file.on('data', (data) => buffers.push(data));
    });
    bb.on('finish', () => {
      const buffer = Buffer.concat(buffers);
      const sheets = xlsx.parse(buffer)[0].data.slice(1);
      const now = new Date().toISOString();
      const result = sheets
        .filter(r => r[0] && r[1] && r[2] != null)
        .map(r => ({
          origin: r[0],
          destination: r[1],
          price: r[2],
          username,
          uploaded_at: now
        }));
      resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
    });
    bb.end(event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body);
  });


};
