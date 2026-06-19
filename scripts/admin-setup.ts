import bcrypt from "bcryptjs";

const password = process.argv[2] || "admin123";
const hash = bcrypt.hashSync(password, 12);
console.log("\nAdmin password hash (copy to env):\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`\nADMIN_JWT_SECRET=${bcrypt.hashSync(Math.random().toString(36), 8).slice(0, 32)}`);
console.log("\nUsage: npx tsx scripts/admin-setup.ts <your-password>");
