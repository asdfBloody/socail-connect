import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity,
        StyleSheet, Alert, ActivityIndicator} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

function ProfileScreen({navigation}: any): React.JSX.Element {
  // TASK 1: states for name, bio, loading
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TASK 2: fetch user data from Firestore
    // hint: firestore().collection('users').doc(uid).get()
    // then set name and bio from the document data
    const fetchProfile = async() => {
        const uid = auth().currentUser?.uid;
        const doc = await firestore().collection('users').doc(uid).get();
        const data = doc.data();
        setName(data?.name);
        setBio(data?.bio);
        setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    // TASK 3: set loading true
    // TASK 4: update the Firestore document with new name and bio
    // hint: .update({ name, bio })
    // TASK 5: Alert "Profile updated successfully"
    // TASK 6: on error Alert the error
    // TASK 7: finally set loading false
    setLoading(true);

    try{
        const uid = auth().currentUser?.uid;
        await firestore().collection('users').doc(uid).update({name, bio});
        Alert.alert('Success', 'Profile updated Successfully'); 
    } catch (error:any){
        Alert.alert("Profile Updation Failed", error.message)
    } finally{
        setLoading(false);
    }
  };

  return (
    // TASK 8: UI with:
    // - Title "Edit Profile"
    // - TextInput for name
    // - TextInput for bio (multiline)
    // - Save button
    // - Logout button (reuse from HomeScreen)
    <View style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.form}>
            <TextInput
                style={styles.input}
                placeholder='Name'
                value={name}
                onChangeText={setName}/>

            <TextInput
                style={styles.input}
                placeholder='Bio'
                multiline
                numberOfLines={3}
                value={bio}
                onChangeText={setBio}/>

            {loading ? (
                <ActivityIndicator size='large' color='#6C63FF'/>
            ) : <TouchableOpacity
                style={styles.button}
                onPress={()=>handleUpdate()}>
                    <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>
            }

            <TouchableOpacity
                onPress={()=> navigation.navigate('Home')}>
                    <Text style={styles.link}>Go Back to Home Screen</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={ async ()=> {
                    await auth().signOut();
                    navigation.replace('Login')
                }}>
                    <Text style={styles.logoutLink}>Logout</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create ({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#6C63FF',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#888',
      textAlign: 'center',
      marginBottom: 32,
    },
    form :{
      gap: 12
    },
    input :{
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      backgroundColor: '#f9f9f9',
    },
    error :{
      color: 'red',
      fontSize: 12,
      marginTop: -8,
    },
    button: {
      backgroundColor: '#6C63FF',
      padding: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    link: {
      color: '#6C63FF',
      textAlign: 'center',
      marginTop: 16,
    },
    logoutLink: {
      color: 'red',
      textAlign: 'center',
      marginTop: 8,
    },
})

export default ProfileScreen;