import React, {useCallback} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import auth from '@react-native-firebase/auth';
import {Post} from '../context/PostContext';

interface Props {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onAuthorPress: (authorId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

function timeAgo(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function PostCard({
  post,
  onLike,
  onComment,
  onAuthorPress,
  onEdit,
  onDelete,
}: Props) {
  const uid = auth().currentUser?.uid;
  const hasLiked = post.likes.includes(uid || '');
  const isAuthor = uid === post.authorId;

  const likeScale = useSharedValue(1);

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{scale: likeScale.value}],
  }));

  const handleLike = useCallback(() => {
    likeScale.value = withSequence(
      withSpring(1.4, {damping: 4}),
      withSpring(1, {damping: 6}),
    );
    onLike(post.id);
  }, [likeScale, onLike, post.id]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {post.authorPhoto ? (
          <Image source={{uri: post.authorPhoto}} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {post.authorName?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <TouchableOpacity onPress={() => onAuthorPress(post.authorId)}>
            <Text style={styles.authorName}>{post.authorName}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        {isAuthor && (onEdit || onDelete) ? (
          <View style={styles.ownerActions}>
            {onEdit ? (
              <TouchableOpacity
                style={styles.ownerBtn}
                onPress={() => onEdit(post)}>
                <Text style={styles.ownerBtnText}>✏️</Text>
              </TouchableOpacity>
            ) : null}
            {onDelete ? (
              <TouchableOpacity
                style={styles.ownerBtn}
                onPress={() => onDelete(post)}>
                <Text style={styles.ownerBtnText}>🗑️</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      {post.imageBase64 ? (
        <Image
          source={{uri: post.imageBase64}}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Animated.Text
            style={[
              styles.actionText,
              hasLiked && styles.liked,
              animatedLikeStyle,
            ]}>
            {hasLiked ? '❤️' : '🤍'} {post.likes.length}
          </Animated.Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(post.id)}>
          <Text style={styles.actionText}>💬 {post.commentsCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    marginHorizontal: responsiveWidth(4),
    marginVertical: responsiveHeight(0.8),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(1.2),
    gap: responsiveWidth(2.5),
  },
  avatar: {
    width: responsiveWidth(11),
    height: responsiveWidth(11),
    borderRadius: responsiveWidth(5.5),
  },
  avatarPlaceholder: {
    width: responsiveWidth(11),
    height: responsiveWidth(11),
    borderRadius: responsiveWidth(5.5),
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(2),
  },
  headerText: {
    flex: 1,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
  },
  ownerBtn: {
    padding: responsiveWidth(1.5),
  },
  ownerBtnText: {
    fontSize: responsiveFontSize(2),
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: responsiveFontSize(1.8),
    color: '#6C63FF',
  },
  time: {
    fontSize: responsiveFontSize(1.4),
    color: '#999',
    marginTop: 2,
  },
  postText: {
    fontSize: responsiveFontSize(1.8),
    color: '#333',
    lineHeight: responsiveFontSize(2.8),
    marginBottom: responsiveHeight(1),
  },
  postImage: {
    width: '100%',
    height: responsiveHeight(25),
    borderRadius: responsiveWidth(2.5),
    marginBottom: responsiveHeight(1),
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: responsiveHeight(1),
    gap: responsiveWidth(6),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: responsiveFontSize(1.8),
    color: '#666',
  },
  liked: {
    color: '#e74c3c',
  },
});

export default React.memo(PostCard);
