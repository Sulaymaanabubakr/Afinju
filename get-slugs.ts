import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccountParams = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({ credential: cert(serviceAccountParams) });

const db = getFirestore();
async function run() {
  const snap = await db.collection('products').get();
  console.log("Current Product Slugs in DB:");
  snap.docs.forEach(d => {
    console.log(`ID: ${d.id} | Slug: ${d.data().slug}`);
  });
}
run();
