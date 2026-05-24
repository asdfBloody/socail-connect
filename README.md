# SocialConnect

A simple social network built with React Native + Firebase (Auth, Firestore, Cloud Messaging, Cloud Functions).

## Features

- **Auth**: email/password signup, login, password reset
- **Posts**: create, edit, delete, like, comment; optional inline image
- **Profile**: editable name, bio, and profile picture
- **Follow system**: follow/unfollow other users; follower/following counts
- **Messaging**: 1:1 chat with text messages
- **Search**: find users by name/bio or posts by text/author
- **Push notifications** (FCM) for likes and comments on your posts
- **Bottom-tab navigation**: Home / Search / Messages / Profile / Settings

## Project layout

```
App.tsx                         App entry + navigation
src/
  components/PostCard.tsx       Post UI
  context/AuthContext.tsx       Auth state
  context/PostContext.tsx       Posts (CRUD + like)
  context/FollowContext.tsx     Follow/unfollow
  screens/                      All app screens
  services/ChatService.ts       Messaging helpers
  services/NotificationService.ts  FCM setup
functions/index.js              Cloud Functions for like/comment push
```

## Setup

### 1. Prerequisites

- Node >= 22.11
- JDK 17, Android Studio (for Android) / Xcode (for iOS)
- A Firebase project with **Auth (Email)**, **Firestore**, **Storage**, **Cloud Messaging** enabled

Follow [React Native — Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) first.

### 2. Install dependencies

```sh
npm install
```

For iOS, also install Pods:

```sh
bundle install            # first time only
bundle exec pod install   # in ios/ directory
```

### 3. Connect Firebase

1. Create a Firebase project at https://console.firebase.google.com.
2. Add an Android app (`com.socialconnect`) → download `google-services.json` → drop into `android/app/`.
3. Add an iOS app (`com.socialconnect`) → download `GoogleService-Info.plist` → drop into `ios/SocialConnect/`.
4. In Firestore, create the database in **production mode** (or test, your call).
5. Enable Email/Password sign-in in Firebase Auth.

### 4. (Optional) Deploy Cloud Functions for push notifications

```sh
cd functions
npm install
firebase deploy --only functions
```

This deploys two triggers that send a push notification to the post author when:
- someone likes their post (`onPostLiked`)
- someone comments on their post (`onCommentAdded`)

## Run

```sh
npm start            # start Metro bundler

# in another terminal:
npm run android      # build & launch on Android emulator or device
npm run ios          # build & launch on iOS simulator
```

## Test

```sh
npm test
```

Renders the full `<App />` tree under the test renderer with Firebase + native modules mocked (`jest.setup.js`).

## Build for production

### Android

```sh
cd android
./gradlew assembleRelease       # produces android/app/build/outputs/apk/release/app-release.apk
# or for the Play Store:
./gradlew bundleRelease         # produces android/app/build/outputs/bundle/release/app-release.aab
```

You will need a signing keystore — see [React Native — Signed APK Android](https://reactnative.dev/docs/signed-apk-android).

### iOS

Open `ios/SocialConnect.xcworkspace` in Xcode, choose **Any iOS Device (arm64)** as the build target, then **Product → Archive**. Distribute via the Organizer window.

See [React Native — Publishing to App Store](https://reactnative.dev/docs/publishing-to-app-store) for the full flow.

## Firestore data model

```
users/{uid}
  name, bio, photoURL, email, fcmToken
  following:  [uid, ...]
  followers:  [uid, ...]

posts/{postId}
  text, imageBase64?, authorId, authorName, authorPhoto,
  likes: [uid, ...], commentsCount, createdAt, updatedAt?
  comments/{commentId}    { text, authorId, authorName, createdAt }

chats/{chatId}            # chatId = sorted(uidA, uidB).join('_')
  participants: [uidA, uidB], lastMessage, lastSenderId, lastMessageAt
  messages/{messageId}    { text, senderId, createdAt }
```

## Notes

- Images are stored as base64 inline on documents to keep things simple. For real use, switch to Firebase Storage and reference the download URL.
- Search filters client-side on a Firestore-bounded query (limit 100 users / live post feed). Switch to a denormalized lowercase index field for prefix queries at larger scale.
