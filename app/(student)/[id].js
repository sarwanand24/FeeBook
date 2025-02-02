import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";

const StudentDetails = () => {
  const { id } = useLocalSearchParams(); // Get studentId from URL
  const router = useRouter();

  const [student, setStudent] = useState({
    fullName: "loading",
    class: null,
    email: "loading",
    mobileNo: null,
    subjects: "loading",
    fee: null,
  });
  const [feeRecords, setFeeRecords] = useState([]);
  const [dueFee, setDueFee] = useState(0);
  const [dueFeeText, setDueFeeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [formattedRecords, setFormattedRecords] = useState([]);

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  const fetchStudentDetails = async () => {
    try {
      const response = await axios.get(`https://e48f-2409-4061-112-111f-5462-9f8c-c86-a7f1.ngrok-free.app/api/v1/teachers/student/${id}`);
      const data = response.data;
      console.log('response--->', response.data)
      console.log('feeRecord--->', response.data.feeRecords)
      console.log('student data--<>', data.student)
      setStudent(data.student);
      setFeeRecords(data.feeRecords);
      calculateDueFees(data.feeRecords, data.student.fee);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching student details:", error);
      setLoading(false);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const calculateDueFees = (records, monthlyFee) => {
    if (!records || records.length === 0) {
      console.log("No fee records found");
      return { dueMonthsText: "No previous payments found", dueFee: 0 };
    }
  
    // 🔹 Find the last paid record correctly
    let lastPaidRecord = records.reduce((latest, record) => {
      const latestYear = latest.year;
      const recordYear = record.year;
      const latestMonthIndex = monthNames.indexOf(latest.month);
      const recordMonthIndex = monthNames.indexOf(record.month);
  
      return (recordYear > latestYear || (recordYear === latestYear && recordMonthIndex > latestMonthIndex))
        ? record
        : latest;
    });
  
    console.log("✅ Last paid record:", lastPaidRecord);
  
    let lastPaidMonthIndex = monthNames.indexOf(lastPaidRecord.month);
    let lastPaidYear = lastPaidRecord.year;
  
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let dueMonths = [];
    let year = lastPaidYear;
    let monthIndex = lastPaidMonthIndex + 1;
  
    // ✅ FIXED: If last paid month is December, move to January of next year
    if (monthIndex === 12) {
      monthIndex = 0;  // January
      year++;
    }
  
    // 🔹 Collect all due months properly
    while (year < currentYear || (year === currentYear && monthIndex <= currentMonthIndex)) {
      dueMonths.push(`${monthNames[monthIndex]} ${year}`);
  
      // Move to next month
      monthIndex++;
      if (monthIndex === 12) { // If December, reset to January and increase year
        monthIndex = 0;
        year++;
      }
    }
  
    // 🔹 Calculate total due fee separately
    let dueFee = dueMonths.length * monthlyFee;
  
    // ✅ Format the due months text properly
    let dueMonthsText = dueMonths.length ? 'Due For '+dueMonths.join(", ") : "All Fees is cleared till current month";
  
    console.log("🚨 Due for:", dueMonthsText);
    console.log("💰 Total Due Fee:", dueFee);
    setDueFeeText(dueMonthsText);
    setDueFee(dueFee);

     // ✅ Set formatted records for FlatList
     console.log('due monthsn log-->', dueMonths);
        setFormattedRecords(dueMonths?.map((item, index) => {
      const [month, year] = item.split(" "); // Split "January 2025" into "January" and "2025"
      return { id: index.toString(), month, year };
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return emailRegex.test(email);
  };  

  const updateStudent = async () => {
    if (!validateEmail(student.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
  
    try {
      setLoading(true);
      const response = await fetch(
        `https://e48f-2409-4061-112-111f-5462-9f8c-c86-a7f1.ngrok-free.app/api/v1/teachers/student/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student }) // ✅ Now wrapping the student object properly
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to update student details");
      }
  
      Alert.alert("Success", "Student details updated successfully");
      fetchStudentDetails();
    } catch (error) {
      console.error("Error updating student:", error);
      Alert.alert("Error", error.message || "Failed to update student details");
    } finally{setLoading(false)}
  };
  
  const markStudentLeft = async () => {
    Alert.alert(
      "Confirm Action",
      "Are you sure the student has left the tuition?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              setLoading(true)
              const response = await fetch(
                `https://e48f-2409-4061-112-111f-5462-9f8c-c86-a7f1.ngrok-free.app/api/v1/teachers/student/${id}/leave`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isLeft: true }),
                }
              );
  
              const data = await response.json();
  
              if (!response.ok) {
                throw new Error(data.message || "Failed to update student status");
              }
  
              Alert.alert("Success", "Student has been marked as left.");
              router.back();
            } catch (error) {
              console.error("Error marking student as left:", error);
              Alert.alert("Error", "Failed to update student status.");
            }finally{setLoading(false)}
          },
        },
      ]
    );
  };

  const markAsPaid = async (month, year) => {
    try {
      setLoading(true);
      const teacherData = await AsyncStorage.getItem("Teacherdata");
    const teacher = JSON.parse(teacherData);
      const response = await fetch(
        "https://e48f-2409-4061-112-111f-5462-9f8c-c86-a7f1.ngrok-free.app/api/v1/teachers/student/update-fee",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId: id, month, year, Class: student.class, amountPaid: student.fee, teacher: teacher._id}),
        }
      );
  
      const result = await response.json();
  
      if (response.ok) {
        setFormattedRecords(formattedRecords.filter(fee => !(fee.month === month && fee.year === year)));
        Alert.alert("Success", `Marked ${month} ${year} as paid`);
      } else {
        Alert.alert("Error", result.message || "Failed to update fee record");
      }
    } catch (error) {
      console.error("Error updating fee:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }finally{setLoading(false)}
  };
  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Student Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={student.fullName}
        onChangeText={(text) => setStudent({ ...student, fullName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={student.email}
        onChangeText={(text) => setStudent({ ...student, email: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile No"
        value={student.mobileNo}
        keyboardType="numeric"
        onChangeText={(text) => setStudent({ ...student, mobileNo: text })}
      />
       <TextInput
        style={styles.input}
        placeholder="Class"
        value={student.class}
        onChangeText={(text) => setStudent({ ...student, class: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Subjects"
        value={student.subjects}
        onChangeText={(text) => setStudent({ ...student, subjects: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Fee"
        value={student.fee?.toString()}
        keyboardType="numeric"
        onChangeText={(text) => setStudent({ ...student, fee: text })}
      />

      <Text style={styles.dueText}>Joined On: {new Date(student.joinedDate).toLocaleDateString()}</Text>
      <Text style={styles.dueText}>{dueFeeText}</Text>
      <Text style={styles.dueText}>Total Due: {dueFee}</Text>

    <FlatList
        data={formattedRecords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 10,
              marginTop: 10,
              backgroundColor: 'lightblue',
              borderRadius: 15
            }}
          >
            <Text>{`${item.month} ${item.year}`}</Text>
            <TouchableOpacity onPress={() => markAsPaid(item.month, item.year)}>
              <Text style={{ color: "green" }}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={updateStudent}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaveButton} onPress={markStudentLeft}>
          <Text style={styles.buttonText}>Student Left</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default StudentDetails;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  dueText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  leaveButton: {
    flex: 1,
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
