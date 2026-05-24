const {onDocumentUpdated, onDocumentCreated} = require('firebase-functions/v2/firestore');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {getMessaging} = require('firebase-admin/messaging');

initializeApp();

// Notify post author when someone likes their post
exports.onPostLiked = onDocumentUpdated('posts/{postId}', async event => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (after.likes.length <= before.likes.length) return null;

  const likerId = after.likes[after.likes.length - 1];
  const postAuthorId = after.authorId;

  if (likerId === postAuthorId) return null;

  const db = getFirestore();

  const [likerDoc, authorDoc] = await Promise.all([
    db.collection('users').doc(likerId).get(),
    db.collection('users').doc(postAuthorId).get(),
  ]);

  const likerName = likerDoc.data()?.name || 'Someone';
  const fcmToken = authorDoc.data()?.fcmToken;

  if (!fcmToken) return null;

  return getMessaging().send({
    token: fcmToken,
    notification: {
      title: '❤️ New Like!',
      body: `${likerName} liked your post`,
    },
    android: {notification: {channelId: 'default'}},
  });
});

// Notify post author when someone comments on their post
exports.onCommentAdded = onDocumentCreated(
  'posts/{postId}/comments/{commentId}',
  async event => {
    const comment = event.data.data();
    const postId = event.params.postId;

    const commenterId = comment.authorId;
    const commenterName = comment.authorName;

    const db = getFirestore();
    const postDoc = await db.collection('posts').doc(postId).get();
    const postAuthorId = postDoc.data()?.authorId;

    if (commenterId === postAuthorId) return null;

    const authorDoc = await db.collection('users').doc(postAuthorId).get();
    const fcmToken = authorDoc.data()?.fcmToken;

    if (!fcmToken) return null;

    return getMessaging().send({
      token: fcmToken,
      notification: {
        title: '💬 New Comment!',
        body: `${commenterName} commented on your post`,
      },
      android: {notification: {channelId: 'default'}},
    });
  },
);
