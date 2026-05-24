import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {Post} from '../context/PostContext';
import {useFollow} from '../context/FollowContext';

interface UserData {
  name: string;
  bio: string;
  photoURL?: string;
  email?: string;
  followers?: string[];
  following?: string[];
}

function buildChatId(a: string, b: string) {
  return [a, b].sort().join('_');
}

function UserProfileScreen({route, navigation}: any): React.JSX.Element {
  const {userId} = route.params;
  const currentUid = auth().currentUser?.uid;
  const isMe = currentUid === userId;
  const {isFollowing, toggleFollow} = useFollow();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    const unsubscribeUser = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(doc => {
        setUserData(doc.data() as UserData);
      });

    const unsubscribePosts = firestore()
      .collection('posts')
      .where('authorId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
        setUserPosts(data);
        setLoading(false);
      });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [userId]);

  const handleToggleFollow = async () => {
    setFollowBusy(true);
    try {
      await toggleFollow(userId);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = () => {
    if (!currentUid) return;
    navigation.navigate('Chat', {
      chatId: buildChatId(currentUid, userId),
      otherUserId: userId,
      otherUserName: userData?.name || 'User',
    });
  };

  const following = isFollowing(userId);
  const followersCount = userData?.followers?.length || 0;
  const followingCount = userData?.following?.length || 0;

  const renderPost = ({item}: {item: Post}) => (
    <View style={styles.postCard}>
      <Text style={styles.postText}>{item.text}</Text>
      {item.imageBase64 ? (
        <Image
          source={{uri: item.imageBase64}}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}
      <Text style={styles.postMeta}>
        ❤️ {item.likes.length}  💬 {item.commentsCount}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <FlatList
      data={userPosts}
      keyExtractor={item => item.id}
      renderItem={renderPost}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.profileHeader}>
          {userData?.photoURL ? (
            <Image source={{uri: userData.photoURL}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userData?.name?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{userData?.name}</Text>
          {userData?.bio ? (
            <Text style={styles.bio}>{userData.bio}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {!isMe ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  following && styles.followBtnActive,
                ]}
                onPress={handleToggleFollow}
                disabled={followBusy}>
                {followBusy ? (
                  <ActivityIndicator
                    color={following ? '#6C63FF' : '#fff'}
                    size="small"
                  />
                ) : (
                  <Text
                    style={[
                      styles.followBtnText,
                      following && styles.followBtnTextActive,
                    ]}>
                    {following ? 'Unfollow' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageBtn}
                onPress={handleMessage}>
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 36,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  bio: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  followBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 110,
    alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  followBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  followBtnTextActive: {
    color: '#6C63FF',
  },
  messageBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C63FF',
    minWidth: 110,
    alignItems: 'center',
  },
  messageBtnText: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
  },
  postText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  postMeta: {
    fontSize: 14,
    color: '#999',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 15,
  },
});

export default UserProfileScreen;
