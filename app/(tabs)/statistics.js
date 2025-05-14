import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const RevenueScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenueTillDate: 0,
    totalDueTillDate: 0,
    totalRevenueForSelectedPeriod: 0,
    totalDueForSelectedPeriod: 0,
    studentsJoined: 0,
    studentsLeft: 0,
    availableYears: [],
  });
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  // Month Names Array
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [selectedMonth, selectedYear])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const teacherData = await AsyncStorage.getItem("Teacherdata");
      const teacher = JSON.parse(teacherData);

      const response = await axios.get(
        `https://feebook-server.onrender.com/api/v1/teachers/revenue/${teacher._id}`,
        { params: { month: selectedMonth, year: selectedYear } }
      );

      setData({
        totalRevenueTillDate: response.data.totalRevenueTillDate || 0,
        totalDueTillDate: response.data.totalDueTillDate || 0,
        totalRevenueForSelectedPeriod: response.data.totalRevenueForSelectedPeriod || 0,
        totalDueForSelectedPeriod: response.data.totalDueForSelectedPeriod || 0,
        studentsJoined: response.data.studentsJoined || 0,
        studentsLeft: response.data.studentsLeft || 0,
      });

      setAvailableYears(response.data.availableYears || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Overall Statistics */}
      <View style={styles.summaryContainer}>
        <Text style={styles.headerText}>Total Revenue: ₹{data.totalRevenueTillDate}</Text>
        <Text style={styles.headerText}>Total Due: ₹{data.totalDueTillDate}</Text>
      </View>

      {/* Month & Year Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedMonth}
          onValueChange={(itemValue) => setSelectedMonth(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="All Months" value={null} />
          {monthNames.map((month, index) => (
            <Picker.Item key={index} label={month} value={index + 1} />
          ))}
        </Picker>

        <Picker
          selectedValue={selectedYear}
          onValueChange={(itemValue) => setSelectedYear(itemValue)}
          style={styles.picker}
        >
          {availableYears.map((year, index) => (
            <Picker.Item key={index} label={year.toString()} value={year} />
          ))}
        </Picker>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <>
          {/* Selected Period Data */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Selected Period Data</Text>
            <Text style={styles.cardText}>Revenue: ₹{data.totalRevenueForSelectedPeriod}</Text>
            <Text style={styles.cardText}>Due: ₹{data.totalDueForSelectedPeriod}</Text>
            <Text style={styles.cardText}>Students Joined: {data.studentsJoined}</Text>
            <Text style={styles.cardText}>Students Left: {data.studentsLeft}</Text>
          </View>

          {/* 📊 Bar Chart */}
          <Text style={styles.chartTitle}>Graph Representation</Text>
          <BarChart
            data={[
              { label: "Joined", value: data.studentsJoined },
              { label: "Left", value: data.studentsLeft },
              { label: "Due", value: data.totalDueForSelectedPeriod },
              { label: "Earnings", value: data.totalRevenueForSelectedPeriod },
            ]}
            barWidth={40}
            height={250}
            spacing={20}
            color="#3498db"
          />

          {/* Refresh Button */}
          <TouchableOpacity onPress={fetchStats} style={styles.button}>
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default RevenueScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  summaryContainer: {
    backgroundColor: "#2c3e50",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  picker: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: "#555",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});
