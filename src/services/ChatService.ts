import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface ChatSummary {
  id: string;
  participants: string[];
  lastMessage: string;
  lastSenderId: string;
  lastMessageAt: any;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

export function buildChatId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export async function sendMessage(
  chatId: string,
  otherUserId: string,
  text: string,
) {
  const user = auth().currentUser;
  if (!user) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  const chatRef = firestore().collection('chats').doc(chatId);
  const now = firestore.FieldValue.serverTimestamp();

  await chatRef.set(
    {
      participants: [user.uid, otherUserId].sort(),
      lastMessage: trimmed,
      lastSenderId: user.uid,
      lastMessageAt: now,
    },
    {merge: true},
  );

  await chatRef.collection('messages').add({
    text: trimmed,
    senderId: user.uid,
    createdAt: now,
  });
}

export function subscribeToChats(
  userId: string,
  onChange: (chats: ChatSummary[]) => void,
  onError?: (err: Error) => void,
) {
  return firestore()
    .collection('chats')
    .where('participants', 'array-contains', userId)
    .onSnapshot(
      snapshot => {
        const chats = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as ChatSummary[];
        chats.sort((a, b) => {
          const aTime = a.lastMessageAt?.toMillis?.() ?? 0;
          const bTime = b.lastMessageAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });
        onChange(chats);
      },
      err => {
        onError?.(err);
      },
    );
}

export function subscribeToMessages(
  chatId: string,
  onChange: (messages: ChatMessage[]) => void,
) {
  return firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(snapshot => {
      const messages = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as ChatMessage[];
      onChange(messages);
    });
}