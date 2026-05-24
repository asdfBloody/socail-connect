import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Post {
  id: string;
  text: string;
  imageBase64?: string | null;
  authorId: string;
  authorName: string;
  authorPhoto?: string | null;
  likes: string[];
  commentsCount: number;
  createdAt: any;
}

interface PostContextType {
  posts: Post[];
  loading: boolean;
  createPost: (text: string, imageBase64?: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  updatePost: (
    postId: string,
    text: string,
    imageBase64?: string | null,
  ) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

const PostContext = createContext<PostContextType>({
  posts: [],
  loading: true,
  createPost: async () => {},
  toggleLike: async () => {},
  updatePost: async () => {},
  deletePost: async () => {},
});

export function PostProvider({children}: {children: React.ReactNode}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];
          setPosts(data);
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    return unsubscribe;
  }, []);

  const createPost = useCallback(
    async (text: string, imageBase64?: string) => {
      const user = auth().currentUser;
      if (!user) return;
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      await firestore().collection('posts').add({
        text,
        imageBase64: imageBase64 || null,
        authorId: user.uid,
        authorName: userData?.name || 'Unknown',
        authorPhoto: userData?.photoURL || null,
        likes: [],
        commentsCount: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    },
    [],
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const user = auth().currentUser;
      if (!user) return;
      const postRef = firestore().collection('posts').doc(postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const hasLiked = post.likes.includes(user.uid);
      if (hasLiked) {
        await postRef.update({
          likes: firestore.FieldValue.arrayRemove(user.uid),
        });
      } else {
        await postRef.update({
          likes: firestore.FieldValue.arrayUnion(user.uid),
        });
      }
    },
    [posts],
  );

  const updatePost = useCallback(
    async (
      postId: string,
      text: string,
      imageBase64?: string | null,
    ) => {
      const user = auth().currentUser;
      if (!user) return;
      const postRef = firestore().collection('posts').doc(postId);
      const snapshot = await postRef.get();
      if (snapshot.data()?.authorId !== user.uid) {
        throw new Error('You can only edit your own posts.');
      }
      const update: Record<string, unknown> = {
        text,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      if (imageBase64 !== undefined) {
        update.imageBase64 = imageBase64;
      }
      await postRef.update(update);
    },
    [],
  );

  const deletePost = useCallback(async (postId: string) => {
    const user = auth().currentUser;
    if (!user) return;
    const postRef = firestore().collection('posts').doc(postId);
    const snapshot = await postRef.get();
    if (snapshot.data()?.authorId !== user.uid) {
      throw new Error('You can only delete your own posts.');
    }
    await postRef.delete();
  }, []);

  const value = useMemo(
    () => ({posts, loading, createPost, toggleLike, updatePost, deletePost}),
    [posts, loading, createPost, toggleLike, updatePost, deletePost],
  );

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
}

export const usePosts = () => useContext(PostContext);
