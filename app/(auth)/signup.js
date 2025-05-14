import React, { useState } from "react";
import { 
  View, Text, TextInput, Button, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, StyleSheet 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [tutionName, setTutionName] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return emailRegex.test(email);
  };  
  
  const handleSubmit = async () => {
    if (!fullName || !email || !mobileNo || !tutionName) {
      Alert.alert("Error", "All fields are required!");
      return;
    }
  
    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(
        "https://feebook-server.onrender.com/api/v1/teachers/register",
        {
          fullName,
          email,
          mobileNo,
          tutionName
        }
      );
  
      await AsyncStorage.setItem("token", response.data.data.accessToken);
      await AsyncStorage.setItem("Teacherdata", JSON.stringify(response.data.data.Teacher));
      
      Alert.alert("Success", "Teacher registered successfully!");
      
      // Navigate to dashboard
      router.replace("/(tabs)");
    } catch (error) {
      setLoading(false);
      
      if (error.response) {
        if (error.response.status === 400) {
          Alert.alert("User Exists", "Account already exists. Please log in.");
          router.replace("/login"); // Redirect user to login screen
        } else {
          Alert.alert("Error", error.response.data.message || "Failed to register.");
        }
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    }
  };
  

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={styles.loadingText}>Signing Up...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Signup</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
          />

          <Text style={styles.label}>Mobile No</Text>
          <TextInput 
            style={styles.input} 
            value={mobileNo} 
            onChangeText={setMobileNo} 
            keyboardType="phone-pad" 
          />

          <Text style={styles.label}>Tution Name</Text>
          <TextInput style={styles.input} value={tutionName} onChangeText={setTutionName} />

          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitText}>Register</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  scrollView: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#222",
  },
  subjectContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  removeButton: {
    backgroundColor: "#ff4d4d",
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
