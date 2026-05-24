import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {usePosts, Post} from '../context/PostContext';
import PostCard from '../components/PostCard';

function HomeScreen({navigation}: any): React.JSX.Element {
  const {posts, loading, createPost, toggleLike, updatePost, deletePost} =
    usePosts();
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const handlePickImage = useCallback(async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.5,
      maxWidth: 1080,
      maxHeight: 1080,
    });
    const asset = response.assets?.[0];
    if (asset?.base64) {
      setPostImage(`data:image/jpeg;base64,${asset.base64}`);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingPostId(null);
    setPostText('');
    setPostImage(undefined);
  }, []);

  const handleSubmitPost = useCallback(async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Post text cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingPostId) {
        await updatePost(editingPostId, postText.trim(), postImage ?? null);
      } else {
        await createPost(postText.trim(), postImage);
      }
      closeModal();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  }, [postText, postImage, createPost, updatePost, editingPostId, closeModal]);

  const handleEdit = useCallback((post: Post) => {
    setEditingPostId(post.id);
    setPostText(post.text);
    setPostImage(post.imageBase64 || undefined);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (post: Post) => {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deletePost(post.id);
              } catch (err: any) {
                Alert.alert('Error', err.message);
              }
            },
          },
        ],
      );
    },
    [deletePost],
  );

  const handleAuthorPress = useCallback(
    (authorId: string) => {
      navigation.navigate('UserProfile', {userId: authorId});
    },
    [navigation],
  );

  const handleComment = useCallback(
    (postId: string) => {
      navigation.navigate('Comments', {postId});
    },
    [navigation],
  );

  const renderPost = useCallback(
    ({item}: {item: Post}) => (
      <PostCard
        post={item}
        onLike={toggleLike}
        onComment={handleComment}
        onAuthorPress={handleAuthorPress}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [toggleLike, handleComment, handleAuthorPress, handleEdit, handleDelete],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SocialConnect</Text>
        <TouchableOpacity
          style={styles.newPostBtn}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.newPostBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Post Feed */}
      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet.</Text>
              <Text style={styles.emptySubText}>Be the first to post!</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      {/* Create / Edit Post Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPostId ? 'Edit Post' : 'Create Post'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind?"
              multiline
              value={postText}
              onChangeText={setPostText}
              maxLength={500}
            />

            {postImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{uri: postImage}}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setPostImage(undefined)}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.imageBtn}
                onPress={handlePickImage}>
                <Text style={styles.imageBtnText}>📷 Add Photo</Text>
              </TouchableOpacity>

              {submitting ? (
                <ActivityIndicator color="#6C63FF" />
              ) : (
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmitPost}>
                  <Text style={styles.submitBtnText}>
                    {editingPostId ? 'Save' : 'Post'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.8),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.8),
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  newPostBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: 20,
  },
  newPostBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(1.7),
  },
  loader: {
    marginTop: responsiveHeight(8),
  },
  list: {
    paddingVertical: responsiveHeight(1),
    paddingBottom: responsiveHeight(3),
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: responsiveHeight(10),
  },
  emptyText: {
    fontSize: responsiveFontSize(2.2),
    color: '#333',
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: responsiveFontSize(1.7),
    color: '#999',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: responsiveWidth(5),
    minHeight: responsiveHeight(38),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  modalTitle: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    fontSize: responsiveFontSize(2.2),
    color: '#999',
    padding: 4,
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: responsiveWidth(3.5),
    fontSize: responsiveFontSize(1.8),
    minHeight: responsiveHeight(12),
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
    marginBottom: responsiveHeight(1.5),
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: responsiveHeight(1.5),
  },
  imagePreview: {
    width: '100%',
    height: responsiveHeight(20),
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  imageBtn: {
    padding: responsiveWidth(2),
  },
  imageBtnText: {
    fontSize: responsiveFontSize(1.8),
    color: '#6C63FF',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: responsiveWidth(7),
    paddingVertical: responsiveHeight(1.4),
    borderRadius: 20,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(1.8),
  },
});

export default HomeScreen;
