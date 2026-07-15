import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // TODO: แทนที่ด้วย URL ของ Cloudflare Pages หลังจากผูกเสร็จแล้ว
  // ตัวอย่าง: https://motorboy-dtc-bot.pages.dev/
  static const String baseUrl = 'YOUR_CLOUDFLARE_PAGES_URL';

  /// ส่งรหัส DTC ไปให้ AI วิเคราะห์
  static Future<Map<String, dynamic>> analyzeDtcCode(String code) async {
    try {
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"dtc_code": code}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "success": false,
          "analysis": "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (status: ${response.statusCode})"
        };
      }
    } catch (e) {
      return {
        "success": false,
        "analysis": "ไม่สามารถเชื่อมต่อระบบได้: $e"
      };
    }
  }

  /// ส่งรายงานซ่อมไปยังกลุ่มช่างใน Telegram
  static Future<void> sendJobReportToTelegram(String dtcCode, String vehicleModel) async {
    // TODO: แทนที่ YOUR_BOT_TOKEN และ your_mechanic_group_id
    const String botToken = 'YOUR_BOT_TOKEN';
    const String groupId = 'your_mechanic_group_id';
    final url = Uri.parse('https://api.telegram.org/bot$botToken/sendMessage');

    String reportMessage = """
🚨 **มีเคสซ่อมใหม่เข้ามาระบบ!**
🛵 **รุ่นรถ:** $vehicleModel
🔍 **รหัส DTC ที่สแกนได้:** $dtcCode
📥 กดเปิดดูการวิเคราะห์อาการและราคาประเมินบนแอปได้เลย
""";

    await http.post(url,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "chat_id": groupId,
          "text": reportMessage,
          "parse_mode": "Markdown"
        }));
  }
}