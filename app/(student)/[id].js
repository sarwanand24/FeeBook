import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator,
  FlatList, Modal
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from '@react-native-picker/picker';
import { FontAwesome } from '@expo/vector-icons'; // or any icon library you're using
import DateTimePicker from '@react-native-community/datetimepicker';

const StudentDetails = () => {
  const { id } = useLocalSearchParams(); // Get studentId from URL
  const router = useRouter();

  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);
  const [showFeePicker, setShowFeePicker] = useState(false);
  const [feeFlag, setFeeFlag] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function FeeMonthYearPicker({ feesData, setFeesData, autoOpen = false }) {
    const [showPicker, setShowPicker] = useState(autoOpen);

    const monthYearOptions = useMemo(() => {
      const options = [];
      const start = new Date(feesData.joinedDate);
      console.log('log of feesdata and then student data-->', feesData, 'heress student data-->', student)
      const end = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0); // ⬅️ Fix here
      end.setDate(1);
      end.setHours(0, 0, 0, 0);

      console.log('end date--->', end)

      while (start <= end) {
        options.push({
          label: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
          month: start.getMonth(),
          year: start.getFullYear()
        });
        start.setMonth(start.getMonth() + 1);
        console.log('start end months-->', start, end)
      }

      console.log('options------->', options)

      return options;
    }, [feesData.joinedDate]);

    const handleSelect = (option) => {
      const joinedDate = new Date(feesData.joinedDate);
      const newDate = new Date(option.year, option.month, joinedDate.getDate() + 1);
      console.log('new date ----', newDate)
      setFeesData({ ...feesData, feePaidUntil: newDate });
      setShowPicker(false);
    };

    return (
      <View>
          <Text style={styles.dateText}>
            Fee Paid Until: {monthNames[feesData.feePaidUntil?.getMonth()]} {feesData.feePaidUntil?.getFullYear()}
          </Text>

        <Modal visible={showPicker} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay2}>
            <View style={styles.modalContainer2}>
              <Text style={styles.modalTitle2}>Select Fee Month</Text>

              <FlatList
                data={monthYearOptions.slice().reverse()}
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

  const [student, setStudent] = useState({
    fullName: "loading",
    class: null,
    email: "",
    mobileNo: null,
    subjects: "loading",
    board: 'loading',
    fee: null,
  });
  const [feesData, setFeesData] = useState({
    joinedDate: null,
    feePaidUntil: null,
  });
  const [feeRecords, setFeeRecords] = useState([]);
  const [dueFee, setDueFee] = useState(0);
  const [dueFeeText, setDueFeeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [formattedRecords, setFormattedRecords] = useState([]);
  const [paidMonths, setPaidMonths] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("Unpaid");

  const dataToShow = selectedFilter === "Paid" ? paidMonths : formattedRecords;

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  useEffect(() => {
    console.log('length----->>>', formattedRecords.length)
    console.log('Due fesss---->>>', formattedRecords.length * student.fee)
    setDueFee(formattedRecords.length * student.fee)
  }, [formattedRecords])

  console.log('Paid Months Year-->', paidMonths)

  const fetchStudentDetails = async () => {
    try {
      const response = await axios.get(`https://feebook-server.onrender.com/api/v1/teachers/student/${id}`);
      const data = response.data;
      console.log('response--->', response.data)
      console.log('feeRecords--->', response.data.feeRecords)
      console.log('student data--<>', data.student)

      const feeRecords2 = response.data.feeRecords;
      const formatted = feeRecords2.map((item, index) => ({
        id: index.toString(),
        month: item.month,
        year: item.year.toString()
      }));
      setPaidMonths(formatted);

      setStudent(data.student);
      setFeeRecords(data.feeRecords);
      calculateDueFees(data.feeRecords, data.student.fee);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching student details:", error);
      setLoading(false);
    }
  };

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
    let dueMonthsText = dueMonths.length ? 'Due For ' + dueMonths.join(", ") : "All Fees is cleared till current month";

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

    if (student.email) {
      if (!validateEmail(student.email)) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://feebook-server.onrender.com/api/v1/teachers/student/${id}`,
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
    } finally { setLoading(false) }
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

  const updateFeeData = async () => {
    const feeRecords = generateFeeRecords(feesData.joinedDate, feesData.feePaidUntil, student.fee);
    console.log('fee records.....', feeRecords)
    const teacherData = await AsyncStorage.getItem("Teacherdata");
    const teacher = JSON.parse(teacherData);
    console.log('checking for server before---->', teacher, student.class)
    try {
      setLoading(true);
      const response = await axios.post(`https://feebook-server.onrender.com/api/v1/teachers/update-joinedDate-and-Fees/${id}`, {
        student,
        Class: student.class,
        teacher: teacher._id,
        feeRecords,
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to update Fees details");
      }

      Alert.alert("Success", "Fees details updated successfully");
      fetchStudentDetails();
      setFeeFlag(false);
    } catch (error) {
      console.error("Error updating student fees:", error);
      Alert.alert("Error", error.message || "Failed to update student fees");
    } finally {
      setLoading(false);
    }
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
                `https://feebook-server.onrender.com/api/v1/teachers/student/${id}/leave`,
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
            } finally { setLoading(false) }
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
        "https://feebook-server.onrender.com/api/v1/teachers/student/update-fee",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId: id, month, year, Class: student.class, amountPaid: student.fee, teacher: teacher._id }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setFormattedRecords(formattedRecords.filter(fee => !(fee.month === month && fee.year === year)));
        setPaidMonths(prev => {
          const exists = prev.some(fee => fee.month === month && fee.year === year);
          if (!exists) {
            return [...prev, { id: String(prev.length), month, year }];
          }
          return prev; // No change if already exists
        });
        Alert.alert("Success", `Marked ${month} ${year} as paid`);
      } else {
        Alert.alert("Error", result.message || "Failed to update fee record");
      }
    } catch (error) {
      console.error("Error updating fee:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally { setLoading(false) }
  };

  const markAsUnPaid = async (month, year) => {
    try {
      setLoading(true);
      const teacherData = await AsyncStorage.getItem("Teacherdata");
      const teacher = JSON.parse(teacherData);
      const response = await fetch(
        "https://feebook-server.onrender.com/api/v1/teachers/student/update-fee-unpaid",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId: id, month, year }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setPaidMonths(paidMonths.filter(fee => !(fee.month === month && fee.year === year)));
        setFormattedRecords(prev => {
          const exists = prev.some(fee => fee.month === month && fee.year === year);
          if (!exists) {
            return [...prev, { id: String(prev.length), month, year }];
          }
          return prev; // No change if already exists
        });

        Alert.alert("Success", `Marked ${month} ${year} as UnPaid`);
      } else {
        Alert.alert("Error", result.message || "Failed to update fee record");
      }
    } catch (error) {
      console.error("Error updating fee:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally { setLoading(false) }
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
        placeholder="Board"
        value={student.board}
        onChangeText={(text) => setStudent({ ...student, board: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Fee"
        value={student.fee?.toString()}
        keyboardType="numeric"
        onChangeText={(text) => setStudent({ ...student, fee: text })}
      />

      {/* <Text style={styles.dueText}>Joined On: {new Date(student.joinedDate).toLocaleDateString()}</Text> */}

      <View style={styles.joinRow}>
        <Text style={styles.dueText}>
          Joined On: {new Date(student.joinedDate).toLocaleDateString()}
        </Text>
        <TouchableOpacity onPress={() => setShowJoiningDatePicker(true)}>
          <FontAwesome name="pencil" size={18} color="#555" style={{ marginLeft: 8, marginTop: -9 }} />
        </TouchableOpacity>
      </View>

      {showJoiningDatePicker && (
        <DateTimePicker
          value={new Date(student.joinedDate)}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowJoiningDatePicker(false);
            if (selectedDate) {
              setStudent({ ...student, joinedDate: selectedDate });
              setFeesData({ ...feesData, joinedDate: selectedDate })
              setShowFeePicker(true); // Immediately ask for fee month
            }
          }}
        />
      )}

      {showFeePicker && (
        <FeeMonthYearPicker
          feesData={feesData}
          setFeesData={(newData) => {
            setFeesData(newData);
            setFeeFlag(true);
            setShowFeePicker(false);
          }}
          autoOpen={true} 
        />
      )}


      {feeFlag && (
        <>
          <Text style={styles.dateText}>
            Fee Paid Until: {monthNames[feesData.feePaidUntil?.getMonth()]} {feesData.feePaidUntil?.getFullYear()}
          </Text>

          <TouchableOpacity style={styles.saveButton} onPress={updateFeeData}>
            <Text style={styles.buttonText}>Save Fees Data</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.dueText}>Total Due: {dueFee}</Text>
      {/* <Text style={styles.dueText}>{dueFeeText}</Text> */}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedFilter}
          onValueChange={(value) => setSelectedFilter(value)}
          style={styles.picker}
          dropdownIconColor="#333" // for Android
        >
          <Picker.Item label="Unpaid Months" value="Unpaid" />
          <Picker.Item label="Paid Months" value="Paid" />
        </Picker>
      </View>

      <FlatList
        data={dataToShow}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 15,
              marginVertical: 8,
              marginHorizontal: 10,
              backgroundColor: "#e0f7fa", // Soft teal
              borderRadius: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16, color: "#00796b", fontWeight: "500" }}>
              {`${item.month} ${item.year}`}
            </Text>

            {selectedFilter === 'Unpaid' ? (
              <TouchableOpacity
                onPress={() => markAsPaid(item.month, item.year)}
                style={{
                  backgroundColor: "#aed581", // Light green
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#33691e", fontWeight: "bold" }}>Mark as Paid</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => markAsUnPaid(item.month, item.year)}
                style={{
                  backgroundColor: "#ef9a9a", // Light red
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#b71c1c", fontWeight: "bold" }}>Mark as UnPaid</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 10, color: 'gray' }}>
            No data found
          </Text>
        }
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
    marginVertical: 10,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  picker: {
    height: 50,
    paddingHorizontal: 10,
    color: '#333',
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
    margin: 'auto'
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
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
});
