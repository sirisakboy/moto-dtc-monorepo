import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'dart:math';

class ScannerScreen extends StatefulWidget {
  @override
  _ScannerScreenState createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  String _scannedCode = "ยังไม่ได้ทำการสแกน";
  String _resultText = "กรุณากดปุ่มเพื่อจำลองการสแกนโค้ดจากตัวรถ";
  bool _isLoading = false;

  // รายการโค้ดจำลองสำหรับทดสอบระบบ
  final List<String> _mockDtcCodes = ['P0171', 'P0300', 'P0505', 'E101', 'E105'];

  void _simulateScan() async {
    setState(() {
      _isLoading = true;
      // สุ่มรหัส DTC ออกมา 1 ตัว
      _scannedCode = _mockDtcCodes[Random().nextInt(_mockDtcCodes.length)];
      _resultText = "กำลังส่งรหัส $_scannedCode ไปให้ AI วิเคราะห์อาการและประเมินราคา...";
    });

    // ส่งค่าไปหา Cloudflare
    final response = await ApiService.analyzeDtcCode(_scannedCode);

    setState(() {
      _isLoading = false;
      _resultText = response['analysis'] ?? "ไม่ได้รับข้อมูลตอบกลับ";
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('DTC Motorcycle/EV Scanner'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: Colors.blueGrey[50],
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Text('รหัสที่ตรวจพบจากตัวรถ:',
                        style: TextStyle(fontSize: 16)),
                    SizedBox(height: 10),
                    Text(_scannedCode,
                        style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.red)),
                  ],
                ),
              ),
            ),
            SizedBox(height: 20),
            Expanded(
              child: Card(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: _isLoading
                      ? Center(child: CircularProgressIndicator())
                      : Text(_resultText,
                          style:
                              TextStyle(fontSize: 16, height: 1.5)),
                ),
              ),
            ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _simulateScan,
              icon: Icon(Icons.bluetooth_searching),
              label: Text('จำลองการสแกนรหัสปัญหารถ (OBD)',
                  style: TextStyle(fontSize: 18)),
              style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 15)),
            ),
          ],
        ),
      ),
    );
  }
}