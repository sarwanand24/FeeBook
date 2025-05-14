import React, { useState, useEffect, useMemo } from "react";
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
import { Picker } from '@react-native-picker/picker';


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
    board: '',
    joinedDate: new Date(),
    feePaidUntil: new Date(),
  });
  const [studentsWithDues, setStudentsWithDues] = useState([]);
  const [studentsCleared, setStudentsCleared] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeFilter, setActiveFilter] = useState("All");

  const [classFilter, setClassFilter] = useState("All Classes");

  const uniqueClasses = [
    ...new Set(students.map((student) => student.class)),
  ].sort(); // Sort classes (optional)  


  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  function FeeMonthYearPicker({ studentData, setStudentData }) {
    const [showPicker, setShowPicker] = useState(false);
  
    const monthYearOptions = useMemo(() => {
      const options = [];
      const start = new Date(studentData.joinedDate);
      const end = new Date();
      start.setDate(1); // normalize to 1st of month
      end.setDate(1);
  
      while (start <= end) {
        options.push({
          label: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
          month: start.getMonth(),
          year: start.getFullYear()
        });
        start.setMonth(start.getMonth() + 1);
      }
  
      return options;
    }, [studentData.joinedDate]);
  
    const handleSelect = (option) => {
      const joinedDate = new Date(studentData.joinedDate);
      const newDate = new Date(option.year, option.month, joinedDate.getDate()+1);
      console.log('new date ----', newDate)
      setStudentData({ ...studentData, feePaidUntil: newDate });
      setShowPicker(false);
    };
  
    return (
      <View>
        <TouchableOpacity style={styles.datePicker} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>
            Fee Paid Until: {monthNames[studentData.feePaidUntil.getMonth()]} {studentData.feePaidUntil.getFullYear()}
          </Text>
        </TouchableOpacity>
  
        {/* <Modal visible={showPicker} animationType="slide">
          <FlatList
            data={monthYearOptions.reverse()} // most recent first
            keyExtractor={(item, index) => `${item.month}-${item.year}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)}>
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPicker(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Modal> */}

<Modal visible={showPicker} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay2}>
    <View style={styles.modalContainer2}>
      <Text style={styles.modalTitle2}>Select Fee Month</Text>

      <FlatList
        data={monthYearOptions.slice().reverse()} // Reverse safely
        keyExtractor={(item, index) => `${item.month}-${item.year}`}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)}>
            <Text style={styles.optionText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPicker(false)}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      </View>
    );
  }

// const handleFilterPress = (filterType) => {
//   setActiveFilter(filterType);

//   if (filterType === "All") {
//     setFilteredStudents(students);
//   } else if (filterType === "Dues") {
//     setFilteredStudents(studentsWithDues);
//   } else if (filterType === "Cleared") {
//     setFilteredStudents(studentsCleared);
//   }
// };

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
      const response = await fetch(`https://feebook-server.onrender.com/api/v1/teachers/${teacherId}`);
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

  useEffect(() => {
    AsyncStorage.setItem("filterState", JSON.stringify({ activeFilter, classFilter }));
  }, [activeFilter, classFilter]);
  
  useEffect(() => {
    const loadFilters = async () => {
      const saved = await AsyncStorage.getItem("filterState");
      if (saved) {
        const { activeFilter, classFilter } = JSON.parse(saved);
        setActiveFilter(activeFilter);
        setClassFilter(classFilter);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      handleFilterPress(activeFilter, classFilter); // applies the last selected filter
    }
  }, [students]);
  

  const handleFilterPress = (filterType, selectedClass = classFilter) => {
    console.log('Active Filter--->', activeFilter, classFilter, selectedClass)
    console.log('students data--->', students)
    setActiveFilter(filterType);
    let baseList = students;
  
    // Filter by selected class if not "All Classes"
    if (selectedClass !== "All Classes") {
      baseList = students.filter((student) => student.class === selectedClass);
      console.log('baselist-->', baseList)
    }
  
    if (filterType === "All") {
      setFilteredStudents(baseList);
    } else if (filterType === "Dues") {
      setFilteredStudents(baseList.filter((s) => s.hasDue));
    } else if (filterType === "Cleared") {
      setFilteredStudents(baseList.filter((s) => !s.hasDue));
    }
  };
  

  const fetchStudents = async () => {
    const teacherData = await AsyncStorage.getItem("Teacherdata");
    const teacher = JSON.parse(teacherData);
  
    try {
      const response = await axios.get(
        `https://feebook-server.onrender.com/api/v1/teachers/student/filter/${teacher._id}`
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
      // setFilteredStudents(combinedStudents);
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
   console.log('feepaiduntildate---', feePaidUntil)
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

     if(studentData.email){
      if (!validateEmail(studentData.email)) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }
     }

    console.log('entryyyy')

    const feeRecords = generateFeeRecords(studentData.joinedDate, studentData.feePaidUntil, studentData.fee);
    console.log('fee records.....', feeRecords)
    try {
      setLoading(true)
      const response = await axios.post("https://feebook-server.onrender.com/api/v1/teachers/students", {
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
  {/* Class Filter Dropdown */}
  <TouchableOpacity
    activeOpacity={1}
    style={[
      styles.dropdownContainer,
      activeFilter === "All" && styles.activeButton, // Highlight when specific class is selected
    ]}
  >
    <Picker
      selectedValue={classFilter}
      style={[
        styles.picker,
        activeFilter === "All" && styles.activeText, // Optional: highlight text
      ]}
      onValueChange={(itemValue) => {
        setClassFilter(itemValue);
        handleFilterPress("All", itemValue);
      }}
    >
      <Picker.Item label="All Classes" value="All Classes" />
      {uniqueClasses?.map((cls) => (
        <Picker.Item key={cls} label={`Class ${cls}`} value={cls} />
      ))}
    </Picker>
  </TouchableOpacity>

  {/* Dues Button */}
  <TouchableOpacity
    onPress={() => handleFilterPress("Dues")}
    style={[
      styles.filterButton,
      activeFilter === "Dues" && styles.activeButton,
    ]}
  >
    <Text
      style={[
        styles.filterText,
        activeFilter === "Dues" && styles.activeText,
      ]}
    >
      Dues
    </Text>
  </TouchableOpacity>

  {/* Cleared Button */}
  <TouchableOpacity
    onPress={() => handleFilterPress("Cleared")}
    style={[
      styles.filterButton,
      activeFilter === "Cleared" && styles.activeButton,
    ]}
  >
    <Text
      style={[
        styles.filterText,
        activeFilter === "Cleared" && styles.activeText,
      ]}
    >
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
      <View style={{flex:1}}>
      {filteredStudents.length === 0 ? (
        <Text style={styles.noStudentsText}>
          {activeFilter === 'Dues' ? 'All Fees is Cleared from this Class' : activeFilter === 'Cleared' ? 
          'No one has cleared their fees from this Class' : 'Add Students by tapping the button below'}
          </Text>
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
            <Text style={styles.studentName}>Class: {item.class || "unknown"}</Text>
            <Text style={styles.studentName}>{item.board || 'unknown'}</Text>
      
            {/* Show Due Details Only for Students with Dues */}
            {item.hasDue && (
              <Text style={styles.dueText}>
                {item.dueMonthsText} (Due Fee: ₹{item.dueFee})
              </Text>
            )}
          </TouchableOpacity>
        )}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }} 
      />
      )}

       <TouchableOpacity
        onPress={() => setModalVisible(true)}
          style={styles.addButton}
          >
          <Text style={{color:'white', fontWeight:'bold', fontSize:16}}>Add Student +</Text>
        </TouchableOpacity>

      </View>

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
            placeholder="Board" 
            onChangeText={(text) => setStudentData({ ...studentData, board: text })} 
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

          {/* <TouchableOpacity style={styles.datePicker} onPress={() => setShowFeePaidDatePicker(true)}>
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
          )} */}

          <FeeMonthYearPicker studentData={studentData} setStudentData={setStudentData} />

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
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#fff" },
  searchBar: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 4, marginBottom: 10, borderRadius: 10 },
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
    justifyContent: "space-evenly",
    alignItems: "center",
    marginVertical: 12
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#f0f4f8", // Light pastel background
    borderWidth: 1,
    borderColor: "#cbd5e1",     // Soft border
  },
  activeButton: {
    backgroundColor: "#5e81ac", // Calm blue
    borderColor: "#5e81ac",
  },
  filterText: {
    fontSize: 15,
    color: "#374151", // Darker gray text
  },
  activeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dropdownContainer: {
    borderRadius: 20,
    borderColor: "#cbd5e1",
    borderWidth: 1,
    backgroundColor: "#f9fafb",
    overflow: 'hidden',
    width: 165,
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#374151",
  },
  modalOverlay2: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer2: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalTitle2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#444',
  },
  cancelButton: {
    marginTop: 15,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  dueText : {
    color: 'red',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    position: "absolute",
    bottom: 10,
    left: 50,
    right: 50,
    backgroundColor: "red",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'yellow'
  },
  
});