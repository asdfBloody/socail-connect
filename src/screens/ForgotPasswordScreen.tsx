import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity,
        StyleSheet, Alert, ActivityIndicator} from 'react-native';
import * as Yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';

const forgotSchema = Yup.object().shape({
    email : Yup.string().email().required('Email is Required')
});

function ForgotPasswordScreen({navigation}: any): React.JSX.Element {

    const [loading, setloading]= useState (false);
    const handleForgotPassword = async (values: any) => {

    setloading(true);

    try {
        await auth().sendPasswordResetEmail(values.email);
        Alert.alert('Success', "Check your email for reset link");
        navigation.replace('Login');
    } catch (error: any) {
        Alert.alert ("Email not Found", error.message);
    } finally {
        setloading(false);
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Social Connect</Text>
        <Text style={styles.subtitle}>Forgot Password</Text>

        <Formik
            initialValues={{email:''}}
            validationSchema={forgotSchema}
            onSubmit={handleForgotPassword}>
                {({handleChange, handleBlur, handleSubmit, values, errors, touched}) => (
                    <View style={styles.form}>
                        <TextInput
                        style = {styles.input}
                        placeholder='Email'
                        onChangeText={handleChange('email')}
                        onBlur={handleBlur('email')}
                        value={values.email}
                        keyboardType="email-address"
                        autoCapitalize="none"/>

                        {touched.email && errors.email && (
                            <Text style={styles.error}>{errors.email}</Text>
                        )}

                        {loading ? (
                            <ActivityIndicator size='large' color='#6C63FF'/>
                        ) : <TouchableOpacity
                                style={styles.button}
                                onPress={ () => handleSubmit()}>
                                    <Text style= {styles.buttonText}>Send Reset Link</Text>
                                </TouchableOpacity>
                        }

                        <TouchableOpacity
                            onPress={ () => navigation.navigate('Login')}>
                                <Text style={styles.link}>Back to Login</Text>
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
    form: {
        gap: 12,
    },
    input: {
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
export default ForgotPasswordScreen;