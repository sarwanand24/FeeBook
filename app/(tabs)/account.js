import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function AccountSettings() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updatedTeacher, setUpdatedTeacher] = useState(null);

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
      setTeacher(data);
      setUpdatedTeacher(data);
    } catch (error) {
      console.error("Error fetching teacher details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const teacherData = await AsyncStorage.getItem("Teacherdata");
      const teacher = JSON.parse(teacherData);
      setLoading(true);
      const response = await fetch(`https://feebook-server.onrender.com/api/v1/teachers/${teacher._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTeacher),
      });
      const data = await response.json();
      setTeacher(data);
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('starting logout')
    await AsyncStorage.removeItem('token');
     router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" />
      ) : teacher ? (
        <View style={styles.card}>
          {editing ? (
            <>
              <Text style={styles.title}>Edit Profile</Text>
              <TextInput
                style={styles.input}
                value={updatedTeacher.fullName}
                onChangeText={(text) =>
                  setUpdatedTeacher({ ...updatedTeacher, fullName: text })
                }
                placeholder="Full Name"
              />
              <TextInput
                style={styles.input}
                value={updatedTeacher.email}
                onChangeText={(text) =>
                  setUpdatedTeacher({ ...updatedTeacher, email: text })
                }
                placeholder="Email"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                value={updatedTeacher.mobileNo}
                onChangeText={(text) =>
                  setUpdatedTeacher({ ...updatedTeacher, mobileNo: text })
                }
                placeholder="Mobile Number"
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                value={updatedTeacher.tutionName}
                onChangeText={(text) =>
                  setUpdatedTeacher({ ...updatedTeacher, tutionName: text })
                }
                placeholder="Tuition Name"
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Profile Details</Text>
              <View style={styles.detailsContainer}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{teacher.fullName}</Text>
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{teacher.email}</Text>
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.label}>Mobile:</Text>
                <Text style={styles.value}>{teacher.mobileNo}</Text>
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.label}>Tuition Name:</Text>
                <Text style={styles.value}>{teacher.tutionName}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <Text style={styles.errorText}>Unable to fetch profile details.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  detailsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7f8c8d",
  },
  value: {
    fontSize: 16,
    color: "#2c3e50",
  },
  input: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#bdc3c7",
    fontSize: 16,
    paddingVertical: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: "#7f8c8d",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});
