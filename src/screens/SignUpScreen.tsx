import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, 
        StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import auth from '@react-native-firebase/auth';

// TASK 1: Create signupSchema with these rules:
// - name: required string
// - email: valid email, required
// - password: minimum 6 chars, required
// - confirmPassword: must match password field, required
const signupSchema = Yup.object().shape({
    name : Yup.string().required("Name is required"),
    email : Yup.string().email("Invalid Email").required("Email is required"),
    password : Yup.string().min(6,"Password length must be 6 characters").required("Password is required"),
    confirmPassword : Yup.string().oneOf([Yup.ref('password')], 'Password must match').required('Please confirm your password'),
});

function SignupScreen({navigation}: any): React.JSX.Element {
  // TASK 2: Create a loading state (true/false)
  const [loading, setLoading] = useState(false);

  const handleSignup = async (values: any) => {
    // TASK 3: Set loading to true
    setLoading(true);

    // TASK 4: Use auth().createUserWithEmailAndPassword() 
    //         to register the user
    try{
        await auth().createUserWithEmailAndPassword(values.email, values.password);
        navigation.replace('Home'); // TASK 5: On success, navigate to Home using replace
    } catch (error: any) { // TASK 6: On error, show an Alert with the error message
        Alert.alert ('Signup Failed', error.message);
    } finally { // TASK 7: Set loading to false in finally block
        setLoading(false);
    }
  };

  return (
    // TASK 8: Build the UI similar to LoginScreen but with
    // Name, Email, Password, Confirm Password fields
    // and a Sign Up button
    <View style={styles.container}>
        <Text style={styles.title}>Social Connect</Text>
        <Text style={styles.subtitle}>Sign Up to Continue</Text>

        <Formik 
            initialValues={{name:'', email:'', password:'', confirmPassword:''}}
            validationSchema={signupSchema}
            onSubmit={handleSignup}>
                {({handleChange, handleBlur, handleSubmit, values, errors, touched}) => (
                    <View style={styles.form}>
                        <TextInput
                          style={styles.input}
                          placeholder='name'
                          onChangeText={handleChange('name')}
                          onBlur={handleBlur('name')}
                          value={values.name}/>

                        {touched.name && errors.name && (
                            <Text style={styles.error}>{errors.name}</Text>
                        )}

                        <TextInput
                          style={styles.input}
                          placeholder='email'
                          onChangeText={handleChange('email')}
                          onBlur={handleBlur('email')}
                          value={values.email}
                          keyboardType="email-address"
                          autoCapitalize="none"/>

                        {touched.email && errors.email && (
                            <Text style={styles.error}>{errors.email}</Text>
                        )}

                        <TextInput
                          style={styles.input}
                          placeholder='Password'
                          onChangeText={handleChange('password')}
                          onBlur={handleBlur('password')}
                          value={values.password}
                          secureTextEntry/>

                        {touched.password && errors.password && (
                            <Text style={styles.error}>{errors.password}</Text>
                        )}

                        <TextInput
                          style={styles.input}
                          placeholder='Confirm Password'
                          onChangeText={handleChange('confirmPassword')}
                          onBlur={handleBlur('confirmPassword')}
                          value={values.confirmPassword}
                          secureTextEntry/>

                        {touched.confirmPassword && errors.confirmPassword && (
                            <Text style={styles.error}>{errors.confirmPassword}</Text>
                        )}

                        {loading ? (
                            <ActivityIndicator size='large' color="#6C63FF" />
                        ) : <TouchableOpacity
                                style={styles.button}
                                onPress={ () => handleSubmit()}>
                                <Text style={styles.buttonText}>Sign Up</Text>
                            </TouchableOpacity>
                        }

                        <TouchableOpacity
                          onPress={() => navigation.navigate('Login')}>
                          <Text style={styles.link}>Already have an account? Log In</Text>
                          </TouchableOpacity>
                    </View>
                )}
        </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
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
    }
})

export default SignupScreen;