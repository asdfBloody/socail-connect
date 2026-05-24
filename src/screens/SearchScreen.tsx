import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {usePosts, Post} from '../context/PostContext';

type Mode = 'users' | 'posts';

interface UserResult {
  id: string;
  name: string;
  bio?: string;
  photoURL?: string;
}

function SearchScreen({navigation}: any): React.JSX.Element {
  const {posts} = usePosts();
  const [mode, setMode] = useState<Mode>('users');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const currentUid = auth().currentUser?.uid;

  useEffect(() => {
    if (mode !== 'users') return;
    let cancelled = false;
    setLoadingUsers(true);
    firestore()
      .collection('users')
      .limit(100)
      .get()
      .then(snap => {
        if (cancelled) return;
        const data = snap.docs.map(d => ({id: d.id, ...d.data()})) as UserResult[];
        setUsers(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const trimmed = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!trimmed) return users.filter(u => u.id !== currentUid);
    return users.filter(
      u =>
        u.id !== currentUid &&
        (u.name?.toLowerCase().includes(trimmed) ||
          u.bio?.toLowerCase().includes(trimmed)),
    );
  }, [users, trimmed, currentUid]);

  const filteredPosts = useMemo(() => {
    if (!trimmed) return posts;
    return posts.filter(
      p =>
        p.text?.toLowerCase().includes(trimmed) ||
        p.authorName?.toLowerCase().includes(trimmed),
    );
  }, [posts, trimmed]);

  const renderUser = useCallback(
    ({item}: {item: UserResult}) => (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() =>
          navigation.navigate('UserProfile', {userId: item.id})
        }>
        {item.photoURL ? (
          <Image source={{uri: item.photoURL}} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.userText}>
          <Text style={styles.userName}>{item.name || 'Unknown'}</Text>
          {item.bio ? (
            <Text style={styles.userBio} numberOfLines={1}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderPost = useCallback(
    ({item}: {item: Post}) => (
      <TouchableOpacity
        style={styles.postRow}
        onPress={() => navigation.navigate('Comments', {postId: item.id})}>
        <Text style={styles.postAuthor}>{item.authorName}</Text>
        <Text style={styles.postText} numberOfLines={2}>
          {item.text}
        </Text>
        <Text style={styles.postMeta}>
          ❤️ {item.likes?.length || 0}  💬 {item.commentsCount || 0}
        </Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder={
            mode === 'users' ? 'Search by name or bio…' : 'Search posts…'
          }
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'users' && styles.tabActive]}
          onPress={() => setMode('users')}>
          <Text style={[styles.tabText, mode === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'posts' && styles.tabActive]}
          onPress={() => setMode('posts')}>
          <Text style={[styles.tabText, mode === 'posts' && styles.tabTextActive]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'users' ? (
        loadingUsers ? (
          <ActivityIndicator color="#6C63FF" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={u => u.id}
            renderItem={renderUser}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>No users found.</Text>
            }
            removeClippedSubviews
            maxToRenderPerBatch={15}
            windowSize={10}
          />
        )
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={p => p.id}
          renderItem={renderPost}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>No posts found.</Text>
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {fontSize: 22, fontWeight: 'bold', color: '#6C63FF'},
  searchBox: {paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff'},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 15,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {borderBottomColor: '#6C63FF'},
  tabText: {color: '#777', fontWeight: '600'},
  tabTextActive: {color: '#6C63FF'},
  loader: {marginTop: 30},
  empty: {textAlign: 'center', color: '#999', marginTop: 40},
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {width: 44, height: 44, borderRadius: 22},
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: '#fff', fontWeight: 'bold', fontSize: 18},
  userText: {marginLeft: 12, flex: 1},
  userName: {fontWeight: 'bold', color: '#333', fontSize: 15},
  userBio: {color: '#777', fontSize: 13, marginTop: 2},
  postRow: {
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postAuthor: {fontWeight: 'bold', color: '#6C63FF', marginBottom: 4},
  postText: {color: '#333', fontSize: 15, marginBottom: 6},
  postMeta: {color: '#999', fontSize: 13},
});

export default SearchScreen;
