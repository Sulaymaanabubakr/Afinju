import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const files = fs.readdirSync('.');
const saFile = files.find(f => f.endsWith('.json') && f.includes('firebase-admin'));

if (!saFile) {
  console.log('No service account found!');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync('./' + saFile, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const snap = await db.collection('products').get();
  console.log('--- PRODUCTS IN FIREBASE ---');
  snap.docs.forEach(d => console.log('ID:', d.id, '| Slug:', d.data().slug));
  process.exit(0);
}
run();
