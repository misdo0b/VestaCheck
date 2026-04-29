const bcrypt = require('bcryptjs');

const hash = '$2b$10$FoiT/xH.X3PtEo4FtgYHUODMHX8usEiN8Sgzzab52ftKRDaUFmzxC';
const passwords = ['password123', 'admin123', 'password', '123456'];

async function check() {
  for (const pw of passwords) {
    const match = await bcrypt.compare(pw, hash);
    console.log(`Password "${pw}": ${match ? 'MATCH' : 'NO MATCH'}`);
  }
}

check();
