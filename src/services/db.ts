import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

// 1. REAL-TIME READER: Listens for any changes and updates your app instantly
export function subscribeToCollection<T = any>(
  collectionName: string,
  callback: (data: T[]) => void
) {
  const colRef = collection(db, collectionName);

  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id, // Guarantee real Firestore document ID
        _docId: d.id,
      };
    }) as unknown as T[];
    callback(items);
  });
}

// 2. WRITER: Adds a new record
export async function addRecord(collectionName: string, data: any) {
  if (data && data.id) {
    const docRef = doc(db, collectionName, String(data.id));
    await setDoc(docRef, data);
    return docRef;
  }
  return await addDoc(collection(db, collectionName), data);
}

// 3. UPDATER: Edits an existing record
export async function updateRecord(collectionName: string, docId: string, data: any) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    return;
  } catch (err) {
    // If direct docId update fails, check if doc has an 'id' field matching docId
    const q = query(collection(db, collectionName), where('id', '==', docId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      for (const d of snap.docs) {
        await updateDoc(doc(db, collectionName, d.id), data);
      }
      return;
    }
    throw err;
  }
}

// 4. DELETER: Removes a record 
export async function deleteRecord(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`Direct delete failed for ${docId}:`, err);
  }

  // Also query if any document has an internal 'id' matching docId
  try {
    const q = query(collection(db, collectionName), where('id', '==', docId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      if (d.id !== docId) {
        await deleteDoc(doc(db, collectionName, d.id));
      }
    }
  } catch (err) {
    console.warn(`Query delete failed for ${docId}:`, err);
  }
}