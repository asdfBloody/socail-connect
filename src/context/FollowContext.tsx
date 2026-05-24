import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import firestore from '@react-native-firebase/firestore';
import {useAuth} from './AuthContext';

interface FollowContextType {
  following: string[];
  isFollowing: (userId: string) => boolean;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
}

const FollowContext = createContext<FollowContextType>({
  following: [],
  isFollowing: () => false,
  followUser: async () => {},
  unfollowUser: async () => {},
  toggleFollow: async () => {},
});

export function FollowProvider({children}: {children: React.ReactNode}) {
  const {user} = useAuth();
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setFollowing([]);
      return;
    }
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        const data = doc.data();
        setFollowing(data?.following || []);
      });
    return unsubscribe;
  }, [user]);

  const isFollowing = useCallback(
    (userId: string) => following.includes(userId),
    [following],
  );

  const followUser = useCallback(
    async (userId: string) => {
      if (!user || user.uid === userId) return;
      const batch = firestore().batch();
      const meRef = firestore().collection('users').doc(user.uid);
      const themRef = firestore().collection('users').doc(userId);
      batch.set(
        meRef,
        {following: firestore.FieldValue.arrayUnion(userId)},
        {merge: true},
      );
      batch.set(
        themRef,
        {followers: firestore.FieldValue.arrayUnion(user.uid)},
        {merge: true},
      );
      await batch.commit();
    },
    [user],
  );

  const unfollowUser = useCallback(
    async (userId: string) => {
      if (!user) return;
      const batch = firestore().batch();
      const meRef = firestore().collection('users').doc(user.uid);
      const themRef = firestore().collection('users').doc(userId);
      batch.set(
        meRef,
        {following: firestore.FieldValue.arrayRemove(userId)},
        {merge: true},
      );
      batch.set(
        themRef,
        {followers: firestore.FieldValue.arrayRemove(user.uid)},
        {merge: true},
      );
      await batch.commit();
    },
    [user],
  );

  const toggleFollow = useCallback(
    async (userId: string) => {
      if (isFollowing(userId)) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    },
    [isFollowing, followUser, unfollowUser],
  );

  const value = useMemo(
    () => ({following, isFollowing, followUser, unfollowUser, toggleFollow}),
    [following, isFollowing, followUser, unfollowUser, toggleFollow],
  );

  return (
    <FollowContext.Provider value={value}>{children}</FollowContext.Provider>
  );
}

export const useFollow = () => useContext(FollowContext);
