const bcrypt = require('bcryptjs');

const passwords = ['password123', 'admin123', 'agent123', 'proprio123'];

async function hashAll() {
  for (const p of passwords) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(p, salt);
    console.log(`${p}: ${hash}`);
  }
}

hashAll();
