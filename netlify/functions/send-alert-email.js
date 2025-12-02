const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // Sadece POST isteklerini kabul et
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  // Gövdeyi JSON olarak çöz
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      body: 'Geçersiz JSON gövdesi',
    };
  }

  const items = body.items || [];

  // Env yoksa sağdaki varsayılanları kullan
  const {
    SMTP_USER = 'hasan.hazer@kamilkoc.com.tr',
    SMTP_PASS = '691954ec8c.',
    MAIL_FROM = 'hasan.hazer@kamilkoc.com.tr',
    MAIL_TO = 'hasan.hazer@kamilkoc.com.tr',
  } = process.env;

  // Mail içeriği
  const listText =
    items.length === 0
      ? 'Kritik otobüs bulunamadı.'
      : items
          .map(
            (it) =>
              `${it.plaka} | Bölge: ${it.bolge} | Puan: ${it.puan} | Tarih: ${it.tarih}`
          )
          .join('\n');

  const subject = '70 Puan Altı Otobüsler – Acil Kontrol Gerekiyor';
  const text = `Merhaba,

Aşağıdaki otobüslerin kalite puanları 70'in altında:

${listText}

Bu mesaj sistem tarafından otomatik gönderilmiştir.`;

  // SMTP ayarını KODA SABİTLE: Outlook
  const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com', // Burada kesinlikle outlook host’u kullanıyoruz
    port: 587,
    secure: false, // STARTTLS için false
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject,
      text,
    });

    return {
      statusCode: 200,
      body: 'Mail başarıyla gönderildi.',
    };
  } catch (err) {
    console.error('Mail gönderimi hatası:', err);
    return {
      statusCode: 500,
      body:
        'Mail gönderilemedi: ' +
        (err && err.message ? err.message : String(err)),
    };
  }
};