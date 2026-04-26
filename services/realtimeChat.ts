import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

export type ChatRole = 'patient' | 'caregiver';

export type RealtimeChatMessage = {
  id: string;
  text: string;
  fromRole: ChatRole;
  toRole: ChatRole;
  createdAt: Date;
  clientMessageId: string | null;
  readByPatient: boolean;
  readByCaregiver: boolean;
};

type FirestoreChatMessage = {
  text: string;
  fromRole: ChatRole;
  toRole: ChatRole;
  clientMessageId?: string;
  createdAt?: Timestamp;
  roomId?: string;
  readByPatient?: boolean;
  readByCaregiver?: boolean;
};

const CHAT_COLLECTION = 'chat_messages';
const CHAT_ROOM = 'default-room';

export async function sendRealtimeMessage(fromRole: ChatRole, text: string, clientMessageId?: string) {
  const toRole: ChatRole = fromRole === 'patient' ? 'caregiver' : 'patient';
  const db = getFirebaseDb();
  await addDoc(collection(db, CHAT_COLLECTION), {
    roomId: CHAT_ROOM,
    text,
    fromRole,
    toRole,
    clientMessageId: clientMessageId ?? null,
    createdAt: serverTimestamp(),
    readByPatient: fromRole === 'patient',
    readByCaregiver: fromRole === 'caregiver',
  });
}

export async function markRealtimeMessagesAsRead(role: ChatRole) {
  const db = getFirebaseDb();
  const readField = role === 'patient' ? 'readByPatient' : 'readByCaregiver';
  const q = query(
    collection(db, CHAT_COLLECTION),
    orderBy('createdAt', 'asc'),
    limit(200)
  );

  const snap = await getDocs(q);
  const batch = writeBatch(db);
  let updates = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data() as FirestoreChatMessage;
    if (data.roomId !== CHAT_ROOM) return;
    if (data.toRole !== role) return;
    if (data[readField]) return;
    batch.update(docSnap.ref, { [readField]: true });
    updates += 1;
  });

  if (updates > 0) {
    await batch.commit();
  }
}

export function subscribeRealtimeMessages(
  _role: ChatRole,
  onMessages: (messages: RealtimeChatMessage[]) => void,
  onError?: (error: unknown) => void
) {
  const db = getFirebaseDb();
  const q = query(
    collection(db, CHAT_COLLECTION),
    orderBy('createdAt', 'asc'),
    limit(200)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const mapped = snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreChatMessage;
        if (data.roomId !== CHAT_ROOM) return null;
        return {
          id: doc.id,
          text: data.text ?? '',
          fromRole: data.fromRole,
          toRole: data.toRole,
          clientMessageId: data.clientMessageId ?? null,
          createdAt: data.createdAt?.toDate?.() ?? new Date(0),
          readByPatient: Boolean(data.readByPatient),
          readByCaregiver: Boolean(data.readByCaregiver),
        } satisfies RealtimeChatMessage;
      }).filter((item): item is RealtimeChatMessage => item !== null);
      onMessages(mapped);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}
