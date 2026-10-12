import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import yaml from 'js-yaml';

// Import raw yaml content (Vite supports importing raw text with '?raw')
import membersYaml from '../data/members.yaml?raw';
import coursesYaml from '../data/courses.yaml?raw';
import teamsYaml from '../data/teams.yaml?raw';
import roundsYaml from '../data/rounds.yaml?raw';
import futureRoundsYaml from '../data/future-rounds.yaml?raw';

export async function seedDatabase() {
  const collections = [
    { name: 'members', data: yaml.load(membersYaml) as any[] },
    { name: 'courses', data: yaml.load(coursesYaml) as any[] },
    { name: 'teams', data: yaml.load(teamsYaml) as any[] },
    { name: 'rounds', data: yaml.load(roundsYaml) as any[] },
    { name: 'future_rounds', data: yaml.load(futureRoundsYaml) as any[] },
  ];

  for (const col of collections) {
    if (Array.isArray(col.data)) {
      for (const item of col.data) {
        // Use item.id if available, otherwise generate a unique ID
        const docId = item.id ? String(item.id) : doc(collection(db, col.name)).id;
        await setDoc(doc(db, col.name, docId), item);
      }
    }
  }
  console.log('Successfully seeded database with YAML data!');
}