import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);
  const [showFeePaidDatePicker, setShowFeePaidDatePicker] = useState(false);
  const [studentData, setStudentData] = useState({
    fullName: "",
    email: "",
    mobileNo: "",
    Class: "",
    subjects: "",
    fee: 0,
    joinedDate: new Date(),
    feePaidUntil: new Date(),
  });
  const [studentsWithDues, setStudentsWithDues] = useState([]);
  const [studentsCleared, setStudentsCleared] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeFilter, setActiveFilter] = useState("All");

const handleFilterPress = (filterType) => {
  setActiveFilter(filterType);

  if (filterType === "All") {
    setFilteredStudents(students);
  } else if (filterType === "Dues") {
    setFilteredStudents(studentsWithDues);
  } else if (filterType === "Cleared") {
    setFilteredStudents(studentsCleared);
  }
};

  // useEffect(() => {
  //   fetchStudents();
  // }, []);

  useEffect(() => {
    const fetchTeacherId = async () => {
      const teacherData = await AsyncStorage.getItem("Teacherdata");
      if (teacherData) {
        const { _id } = JSON.parse(teacherData);
        fetchTeacherDetails(_id);
      }
    };

    fetchTeacherId();
  }, []);

  const fetchTeacherDetails = async (teacherId) => {
    try {
      setLoading(true);
      const response = await fetch(`https://e48f-2409-4061-112-111f-5462-9f8c-c86-a7f1.ngrok-free.app/api/v1/teachers/${teacherId}`);
      const data = await response.json();
      setCurrentTeacher(data);
    } catch (error) {
      console.error("Error fetching teacher details:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  const fetchStudents = async () => {
    const teacherData = await AsyncStorage.getItem("Teacherdata");
    const teacher = JSON.parse(teacherData);
  
    try {
      const response = await axios.get(
        `https://e48f-2409-4061-112-111f-5462-9f8c-c86-a7f1.ngrok-free.app/api/v1/teachers/student/filter/${teacher._id}`
      );
  
      console.log("Fetched Students Data:", response.data); // Debugging log
  
      // Extract cleared and due students
      const clearedStudents = response.data.studentsCleared.map(student => ({
        ...student,  // Keep existing fields
        hasDue: false,  // Mark as cleared
        dueFee: 0,
        dueMonths: [],
        dueMonthsText: "",
      }));
  
      const dueStudents = response.data.studentsWithDues.map(dueEntry => ({
        ...dueEntry.student,  // Merge student details
        hasDue: true,  // Mark as due
        dueFee: dueEntry.dueFee,
        dueMonths: dueEntry.dueMonths,
        dueMonthsText: dueEntry.dueMonthsText,
      }));
  
      const combinedStudents = [...clearedStudents, ...dueStudents];
  
      setStudents(combinedStudents);
      setFilteredStudents(combinedStudents);
      setStudentsWithDues(dueStudents);
      setStudentsCleared(clearedStudents);
    } catch (error) {
      console.log("Error fetching students:", error);
    }
  };
  
  const handleSearch = (text) => {
    setSearch(text);
    const filtered = students.filter((student) =>
      student.fullName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const generateFeeRecords = (joiningDate, feePaidUntil, feeAmount) => {
    let records = [];
    let currentDate = new Date(joiningDate);
    const endDate = new Date(feePaidUntil);

    while (currentDate <= endDate) {
      records.push({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        feeAmount,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return records;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return emailRegex.test(email);
  };

  const addStudent = async () => {
    const teacherData = await AsyncStorage.getItem("Teacherdata");
    const teacher = JSON.parse(teacherData);

    if (!validateEmail(studentData.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    console.log('entryyyy')

    const feeRecords = generateFeeRecords(studentData.joinedDate, studentData.feePaidUntil, studentData.fee);

    try {
      setLoading(true)
      const response = await axios.post("https://e48f-2409-4061-112-111f-5462-9f8c-c86-a7f1.ngrok-free.app/api/v1/teachers/students", {
        ...studentData,
        teacher: teacher._id,
        feeRecords,
      });
      if (response.data.success) {
        setModalVisible(false);
        fetchStudents();
      } else {
        alert("Failed to add student");
      }
    } catch (error) {
      console.log("Error adding student:", error);
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
    <View style={styles.container}>
      <Text style={{color:'black', textAlign:'center', fontSize:20, fontWeight:'bold'}}>
        {currentTeacher?.tutionName || 'Loading'}
        </Text>
    <View style={styles.filterContainer}>
      <TouchableOpacity
        onPress={() => handleFilterPress("All")}
        style={[
          styles.filterButton,
          activeFilter === "All" && styles.activeButton,
        ]}
      >
        <Text style={[styles.filterText, activeFilter === "All" && styles.activeText]}>
          All
        </Text>
      </TouchableOpacity>
  
      <TouchableOpacity
        onPress={() => handleFilterPress("Dues")}
        style={[
          styles.filterButton,
          activeFilter === "Dues" && styles.activeButton,
        ]}
      >
        <Text style={[styles.filterText, activeFilter === "Dues" && styles.activeText]}>
          Dues
        </Text>
      </TouchableOpacity>
  
      <TouchableOpacity
        onPress={() => handleFilterPress("Cleared")}
        style={[
          styles.filterButton,
          activeFilter === "Cleared" && styles.activeButton,
        ]}
      >
        <Text style={[styles.filterText, activeFilter === "Cleared" && styles.activeText]}>
          Cleared
        </Text>
      </TouchableOpacity>
    </View>

      <View style={styles.searchBar}>
        <FontAwesome name="search" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          placeholder="Search students..."
          value={search}
          onChangeText={handleSearch}
          style={styles.searchInput}
        />
      </View>
      {filteredStudents.length === 0 ? (
        <Text style={styles.noStudentsText}>No students added yet</Text>
      ) : (
        <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(student)/${item._id}`)}
            style={styles.studentCard}
          >
            <Text style={styles.studentName}>{item.fullName}</Text>
            <Text style={styles.studentName}>Class: {item.class || "Unknown"}</Text>
      
            {/* Show Due Details Only for Students with Dues */}
            {item.hasDue && (
              <Text style={styles.dueText}>
                {item.dueMonthsText} (Due Fee: ₹{item.dueFee})
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
      )}
      <Button title="Add Student" onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} animationType="slide" transparent>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.modalOverlay}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.modalContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.modalTitle}>Add New Student</Text>

          <TextInput 
            style={styles.input} 
            placeholder="Full Name" 
            onChangeText={(text) => setStudentData({ ...studentData, fullName: text })} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            keyboardType="email-address"
            onChangeText={(text) => setStudentData({ ...studentData, email: text })} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Mobile No" 
            keyboardType="phone-pad"
            onChangeText={(text) => setStudentData({ ...studentData, mobileNo: text })} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Class" 
            onChangeText={(text) => setStudentData({ ...studentData, Class: text })} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Subjects" 
            onChangeText={(text) => setStudentData({ ...studentData, subjects: text })} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Fee" 
            keyboardType="numeric"
            onChangeText={(text) => setStudentData({ ...studentData, fee: text })} 
          />

          {/* Joining Date Picker */}
          <TouchableOpacity style={styles.datePicker} onPress={() => setShowJoiningDatePicker(true)}>
            <Text style={styles.dateText}>Joining Date: {studentData.joinedDate.toDateString()}</Text>
          </TouchableOpacity>
          {showJoiningDatePicker && (
            <DateTimePicker
              value={studentData.joinedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowJoiningDatePicker(false);
                setStudentData({ ...studentData, joinedDate: date || studentData.joinedDate });
              }}
            />
          )}

          {/* Fee Paid Until Picker */}
          <TouchableOpacity style={styles.datePicker} onPress={() => setShowFeePaidDatePicker(true)}>
            <Text style={styles.dateText}>Fee Paid Until: {studentData.feePaidUntil.toDateString()}</Text>
          </TouchableOpacity>
          {showFeePaidDatePicker && (
            <DateTimePicker
              value={studentData.feePaidUntil}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowFeePaidDatePicker(false);
                setStudentData({ ...studentData, feePaidUntil: date || studentData.feePaidUntil });
              }}
            />
          )}

          {/* Buttons Row */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.submitButton} onPress={addStudent}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </TouchableWithoutFeedback>
</Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: "#fff" },
  searchBar: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1 },
  noStudentsText: { textAlign: "center", marginTop: 20, fontSize: 16, color: 'black' },
  studentCard: {
    padding: 10,
    backgroundColor: '#2c3e50',
    marginTop: 5,
    borderRadius: 10
  },
  studentName: { 
    fontSize: 16, 
    color: 'white' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)", // Semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  datePicker: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#1976d2",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  closeButton: {
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
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  filterButton: {
    padding: 10,
    backgroundColor: "#007bff",
    color: "white",
    borderRadius: 5,
  },
  dueText: {
    color: "red",
    fontWeight: "bold",
    marginTop: 5,
  }, 
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#e0e0e0", // Default background color
  },
  activeButton: {
    backgroundColor: "#007bff", // Active button color (blue)
  },
  filterText: {
    fontSize: 16,
    color: "#333",
  },
  activeText: {
    color: "#fff", // Change text color when active
    fontWeight: "bold",
  }, 
});