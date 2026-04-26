import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
type EmotionalState = 'calmado' | 'estres' | 'panico';

const STATE_COLLECTION = 'shared_state';
const STATE_DOC_ID = 'bci_state';

export async function publishEmotionalState(state: EmotionalState) {
  const db = getFirebaseDb();
  await setDoc(
    doc(db, STATE_COLLECTION, STATE_DOC_ID),
    {
      emotionalState: state,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export function subscribeEmotionalState(onState: (state: EmotionalState) => void) {
  const db = getFirebaseDb();
  return onSnapshot(doc(db, STATE_COLLECTION, STATE_DOC_ID), (snap) => {
    const data = snap.data() as { emotionalState?: EmotionalState } | undefined;
    const next = data?.emotionalState;
    if (next === 'calmado' || next === 'estres' || next === 'panico') {
      onState(next);
    }
  });
}
