import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'users-db.json');

async function migrate() {
  console.log('Starting migration to hashed passwords...');
  
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const users = JSON.parse(data);
    
    for (const user of users) {
      if (user.password && !user.password.startsWith('$2a$')) {
        console.log(`Hashing password for: ${user.email}`);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      } else {
        console.log(`Skipping: ${user.email} (already hashed)`);
      }
    }
    
    await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
    console.log('Migration successful!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
