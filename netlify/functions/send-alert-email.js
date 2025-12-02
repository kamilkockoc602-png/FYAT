// Netlify Function: send-alert-email
// 70 puan altı otobüsler listesini alır, SMTP ile mail gönderir.
//
// Netlify ortam değişkenleri (Environment variables):
// (Bunları az önce Import environment variables ekranına yazdın)
//
// SMTP_HOST   = smtp.office365.com
// SMTP_PORT   = 587
// SMTP_SECURE = false
// SMTP_USER   = hasan.hazer@kamilkoc.com.tr
// SMTP_PASS   = (bu hesabın şifresi / app password)
// MAIL_FROM   = "Otobüs Puan Listesi <hasan.hazer@kamilkoc.com.tr>"
// MAIL_TO     = "hasan.hazer@kamilkoc.com.tr"  (veya virgülle çoğalt)
//
// Frontend bu function'a POST / JSON gönderiyor:
// { items: [ { plaka, bolge, son_kalite_puani, son_kalite_tarihi, ... }, ... ] }

import nodemailer from 'nodemailer';

export async function handler(event, context) {
  // Sadece POST kabul ediyoruz
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Only POST allowed' };
  }

  // Gövdeden items listesini al
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    return { statusCode: 400, body: 'No items (70 puan altı otobüs) gönderilmedi.' };
  }

  // Ortam değişkenlerini al
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
    MAIL_TO
  } = process.env;

  // Gerekli değişkenler dolu mu kontrol et
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !MAIL_TO) {
    return {
      statusCode: 500,
      body: 'SMTP veya mail ayarları eksik. Lütfen environment değişkenlerini kontrol edin.'
    };
  }

  // Nodemailer transport
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || 'false').toLowerCase() === 'true', // 465 için true, 587 için false
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  // Tarih (konu satırı için)
  const now = new Date();
  const tarihStr =
    String(now.getDate()).padStart(2, '0') + '.' +
    String(now.getMonth() + 1).padStart(2, '0') + '.' +
    now.getFullYear();

  const subject = `70 Puan Altı Otobüsler - ${tarihStr}`;

  // Plain text gövde
  const lines = [
    'Aşağıdaki otobüslerin kalite puanı 70\'in altındadır.',
    'Lütfen acil eksiklerini gideriniz.',
    '',
    'Plaka | Bölge | Puan | Tarih | Marka | Tip | Cari',
    '--------------------------------------------------'
  ];

  items.forEach(it => {
    lines.push(
      `${it.plaka || ''} | ${it.bolge || ''} | ${it.son_kalite_puani ?? '-'} | ` +
      `${it.son_kalite_tarihi || ''} | ${it.marka || ''} | ${it.tip || ''} | ${it.cari_unvan || ''}`
    );
  });

  const textBody = lines.join('\n');

  // HTML tablo
  const htmlRows = items.map(it => `
    <tr>
      <td>${it.plaka || ''}</td>
      <td>${it.bolge || ''}</td>
      <td>${it.son_kalite_puani ?? '-'}</td>
      <td>${it.son_kalite_tarihi || ''}</td>
      <td>${it.marka || ''}</td>
      <td>${it.tip || ''}</td>
      <td>${it.cari_unvan || ''}</td>
    </tr>
  `).join('');

  const htmlBody = `
    <p>Merhaba,</p>
    <p>Aşağıdaki otobüslerin kalite puanı <strong>70'in altındadır</strong>. Lütfen acil eksiklerini gideriniz.</p>
    <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th>Plaka</th><th>Bölge</th><th>Puan</th><th>Tarih</th><th>Marka</th><th>Tip</th><th>Cari</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>
    <p>Gönderim tarihi: ${tarihStr}</p>
  `;

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject,
      text: textBody,
      html: htmlBody
    });

    return { statusCode: 200, body: 'Mail gönderildi.' };
  } catch (err) {
    console.error('SMTP error:', err);
    return {
      statusCode: 500,
      body: 'Mail gönderilemedi: ' + (err.message || String(err))
    };
  }
}