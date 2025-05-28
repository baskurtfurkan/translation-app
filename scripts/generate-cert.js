const devcert = require('devcert');
const fs = require('fs');
const path = require('path');

async function generateCert() {
  try {
    const domains = ['localhost', '192.168.1.15'];
    const ssl = await devcert.certificateFor(domains);

    const certsDir = path.join(__dirname, '..', 'certs');
    if (!fs.existsSync(certsDir)){
      fs.mkdirSync(certsDir);
    }

    fs.writeFileSync(path.join(certsDir, 'cert.pem'), ssl.cert);
    fs.writeFileSync(path.join(certsDir, 'key.pem'), ssl.key);

    console.log('SSL certificates generated successfully!');
  } catch (error) {
    console.error('Error generating certificates:', error);
  }
}

generateCert(); 