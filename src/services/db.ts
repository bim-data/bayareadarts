import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure this points to the firebase.ts file we made earlier

// 1. REAL-TIME READER: Listens for any changes and updates your app instantly
export function subscribeToCollection(collectionName: string, callback: (data: any[]) => void) {
  const colRef = collection(db, collectionName);
  
  // onSnapshot sets up a live connection to the database
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  });
}

// 2. WRITER: Adds a new record (like a new member or round)
export async function addRecord(collectionName: string, data: any) {
  return await addDoc(collection(db, collectionName), data);
}

// 3. UPDATER: Edits an existing record
export async function updateRecord(collectionName: string, docId: string, data: any) {
  return await updateDoc(doc(db, collectionName, docId), data);
}

// 4. DELETER: Removes a record 
export async function deleteRecord(collectionName: string, docId: string) {
  return await deleteDoc(doc(db, collectionName, docId));
}