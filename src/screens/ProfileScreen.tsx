import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

function ProfileScreen(): React.JSX.Element {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const uid = auth().currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const doc = await firestore().collection('users').doc(uid).get();
        const data = doc.data();
        setName(data?.name || '');
        setBio(data?.bio || '');
        setPhotoURL(data?.photoURL || '');
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.5,
        maxWidth: 600,
        maxHeight: 600,
      });
      if (response.didCancel) return;
      const asset = response.assets?.[0];
      if (!asset?.base64) return;
      setPendingPhoto(`data:image/jpeg;base64,${asset.base64}`);
    } catch (err: any) {
      Alert.alert('Image picker error', err.message);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const uid = auth().currentUser?.uid;
      if (!uid) throw new Error('Not signed in.');
      const update: Record<string, unknown> = {
        name: name.trim(),
        bio: bio.trim(),
      };
      if (pendingPhoto) update.photoURL = pendingPhoto;
      await firestore()
        .collection('users')
        .doc(uid)
        .set(update, {merge: true});
      if (pendingPhoto) {
        setPhotoURL(pendingPhoto);
        setPendingPhoto(null);
      }
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Profile update failed', err.message);
    } finally {
      setSaving(false);
    }
  }, [name, bio, pendingPhoto]);

  const displayPhoto = pendingPhoto || photoURL;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity
          onPress={handlePickImage}
          style={styles.avatarWrap}>
          {displayPhoto ? (
            <Image source={{uri: displayPhoto}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>Tap to add photo</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraBadgeText}>📷</Text>
          </View>
        </TouchableOpacity>
        {pendingPhoto ? (
          <Text style={styles.pendingNote}>
            New photo selected — tap Save to apply.
          </Text>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell people about yourself"
            multiline
            value={bio}
            onChangeText={setBio}
            maxLength={200}
          />

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: '#fff'},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 40},
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6C63FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarWrap: {alignSelf: 'center', marginBottom: 8},
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {color: '#999', fontSize: 12, textAlign: 'center'},
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraBadgeText: {fontSize: 14},
  pendingNote: {
    textAlign: 'center',
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  form: {marginTop: 20, gap: 8},
  label: {fontSize: 13, color: '#666', fontWeight: '600', marginTop: 10},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  bioInput: {minHeight: 90, textAlignVertical: 'top'},
  button: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
});

export default ProfileScreen;
