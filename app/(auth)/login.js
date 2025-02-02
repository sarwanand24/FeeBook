import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const[otpMade, setOtpMade] = useState(0);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginData, setLoginData] = useState(null);

    const router = useRouter();

    const sendOTP = async () => {
        if (!email.includes("@")) {
            alert("Enter a valid email!");
            return;
        }

        setLoading(true);
        try {
            // Replace with your backend API
            const generatedOtp = Math.floor(100000 + Math.random() * 900000);
            setOtpMade(generatedOtp); 
            const response = await fetch("https://bfe2-2409-4061-112-111f-60f5-1e4c-757b-9477.ngrok-free.app/api/v1/teachers/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: generatedOtp }),
            });

            const data = await response.json();

            if (data.success) {
                setOtpSent(true);
                alert("OTP sent to your email!");
                 // Store token and teacher data
                 console.log('data-->', data.data)
                 setLoginData(data.data); 
            } else {
                console.log("data check-->", data)
                alert(data.data);
            }
        } catch (error) {
            alert("Failed to send OTP. Try again!");
        }
        setLoading(false);
    };

    const verifyOTP = async () => {
        if (otp.length !== 6) {
            alert("Enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            if (otp == otpMade) {
                if (loginData) {
                    await AsyncStorage.setItem("token", loginData.accessToken);
                    await AsyncStorage.setItem("Teacherdata", JSON.stringify(loginData.teacher));
                    router.replace('/(tabs)'); // Navigate after success
                } else {
                    alert("Session expired. Please request a new OTP.");
                }
            } else {
                alert("Incorrect OTP entered!");
            }
        } catch (error) {
            alert("OTP verification failed!");
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            
            {!otpSent ? (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TouchableOpacity style={styles.button} onPress={sendOTP} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter OTP"
                        keyboardType="numeric"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                    />
                    <TouchableOpacity style={styles.button} onPress={verifyOTP} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                    </TouchableOpacity>
                </>
            )}

<TouchableOpacity onPress={() => router.push("/signup")}>
        <Text style={{ marginTop: 20, color: "blue" }}>New User? Sign Up</Text>
      </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    input: { width: "80%", borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 15, textAlign: "center" },
    button: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, width: "80%", alignItems: "center" },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default LoginScreen;
