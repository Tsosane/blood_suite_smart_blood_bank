import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const BloodSuiteApp());
}

class BloodSuiteApp extends StatelessWidget {
  const BloodSuiteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Blood Suite',
      theme: ThemeData(
        primarySwatch: Colors.red,
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool isLoading = true;
  Map<String, dynamic>? healthData;
  List<dynamic>? donors;
  List<dynamic>? inventory;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      final baseUrl = 'https://blood-suite-smart-blood-bank-6.onrender.com/api';
      
      final healthResponse = await http.get(Uri.parse('$baseUrl/health'));
      final donorsResponse = await http.get(Uri.parse('$baseUrl/donors'));
      final inventoryResponse = await http.get(Uri.parse('$baseUrl/inventory'));

      setState(() {
        healthData = json.decode(healthResponse.body);
        donors = json.decode(donorsResponse.body)['donors'] ?? [];
        inventory = json.decode(inventoryResponse.body)['inventory'] ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Blood Suite'),
        backgroundColor: Colors.red[700],
        foregroundColor: Colors.white,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'System Status',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 8),
                          Text(healthData?['message'] ?? 'Checking status...'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Recent Donors',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 8),
                          ...donors?.take(3).map((donor) => ListTile(
                                title: Text(donor['name'] ?? 'Unknown'),
                                subtitle: Text('${donor['blood_type'] ?? 'N/A'} • ${donor['district'] ?? 'N/A'}'),
                                leading: const Icon(Icons.person, color: Colors.red),
                              )) ?? [const Text('No donors found')],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Blood Inventory',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 8),
                          ...inventory?.map((item) => ListTile(
                                title: Text('Blood Type ${item['blood_type'] ?? 'N/A'}'),
                                subtitle: Text('${item['units'] ?? 0} units available'),
                                leading: const Icon(Icons.bloodtype, color: Colors.red),
                              )) ?? [const Text('No inventory data')],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Donors',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bloodtype),
            label: 'Inventory',
          ),
        ],
        selectedItemColor: Colors.red[700],
      ),
    );
  }
}
