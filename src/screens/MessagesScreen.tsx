import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useAuth} from '../context/AuthContext';
import {ChatSummary, subscribeToChats} from '../services/ChatService';

interface UserMini {
  name: string;
  photoURL?: string;
}

function MessagesScreen({navigation}: any): React.JSX.Element {
  const {user} = useAuth();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState<Record<string, UserMini>>({});

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(
      user.uid,
      data => {
        setChats(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const missing = new Set<string>();
    chats.forEach(c => {
      const other = c.participants.find(p => p !== user.uid);
      if (other && !userCache[other]) missing.add(other);
    });
    if (missing.size === 0) return;

    let cancelled = false;
    Promise.all(
      [...missing].map(async uid => {
        const doc = await firestore().collection('users').doc(uid).get();
        return [uid, doc.data() as UserMini] as const;
      }),
    ).then(entries => {
      if (cancelled) return;
      setUserCache(prev => {
        const next = {...prev};
        entries.forEach(([uid, data]) => {
          next[uid] = data || {name: 'User'};
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [chats, user, userCache]);

  const renderItem = useCallback(
    ({item}: {item: ChatSummary}) => {
      const otherId = item.participants.find(p => p !== user?.uid);
      const other = otherId ? userCache[otherId] : undefined;
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            navigation.navigate('Chat', {
              chatId: item.id,
              otherUserId: otherId,
              otherUserName: other?.name || 'User',
            })
          }>
          {other?.photoURL ? (
            <Image source={{uri: other.photoURL}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {other?.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.rowText}>
            <Text style={styles.name}>{other?.name || 'User'}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastSenderId === user?.uid ? 'You: ' : ''}
              {item.lastMessage}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, user, userCache],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={15}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
            <Text style={styles.emptySub}>
              Open a user's profile and tap Message to start chatting.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {width: 50, height: 50, borderRadius: 25},
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {color: '#fff', fontWeight: 'bold', fontSize: 20},
  rowText: {marginLeft: 12, flex: 1},
  name: {fontWeight: 'bold', fontSize: 16, color: '#333'},
  preview: {color: '#777', fontSize: 14, marginTop: 2},
  empty: {alignItems: 'center', marginTop: 60, paddingHorizontal: 24},
  emptyText: {fontSize: 16, color: '#333', fontWeight: 'bold'},
  emptySub: {fontSize: 14, color: '#999', marginTop: 6, textAlign: 'center'},
});

export default MessagesScreen;