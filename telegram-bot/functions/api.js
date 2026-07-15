export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method !== 'POST') {
        return new Response("OK - Use POST for analysis", { status: 200 });
      }

      const contentType = request.headers.get("content-type") || "";
      const contentLength = request.headers.get("content-length");
      
      if (!contentLength || parseInt(contentLength) === 0) {
        return new Response(JSON.stringify({ error: "Empty request body" }), { 
          status: 400, 
          headers: { "Content-Type": "application/json" }
        });
      }

      // ดึงค่า Telegram Token และ AI binding
      const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
      const cloudflareAI = env.AI;
      
      let userMessage = "";
      let chatId = null;
      
      // แยกแยะว่ามาจาก Flutter หรือ Telegram
      const isFromFlutter = contentType.includes("application/json") && !request.headers.get("user-agent")?.includes("Telegram");

      try {
        let parsedBody;
        if (isFromFlutter) {
          parsedBody = await request.json();
          userMessage = (parsedBody.dtc_code || parsedBody.message || "").toString();
        } else {
          parsedBody = await request.json();
          if (parsedBody.message && parsedBody.message.text) {
            chatId = parsedBody.message.chat.id;
            userMessage = (parsedBody.message.text || "").toString();
          }
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON format" }), { 
          status: 400, 
          headers: { "Content-Type": "application/json" }
        });
      }

      if (userMessage.length === 0) {
        return new Response(JSON.stringify({ error: "No message provided" }), { 
          status: 400, 
          headers: { "Content-Type": "application/json" }
        });
      }

      // 🧠 พรอมต์ช่างบอยอัจฉริยะ
      const systemPrompt = `คุณคือ "ช่างบอย อัจฉริยะ" ช่างซ่อมและวิเคราะห์ปัญหามอเตอร์ไซค์น้ำมัน และมอเตอร์ไซค์ไฟฟ้า (EV) ทุกรุ่น
หน้าที่ของคุณคือการช่วยเหลือผู้ใช้ โดยตอบกลับเป็นภาษาไทยที่สุภาพ เป็นกันเองเหมือนช่างคุยกับลูกค้า และจัดหมวดหมู่ข้อมูลให้ชัดเจน

คำถามหรืออาการจากผู้ใช้: "${userMessage}"

กรุณาประมวลผลและตอบกลับตามโครงสร้างนี้เสมอ (ใช้ Markdown ในการจัดตัวหนา/หัวข้อ):

🛠️ **[วิเคราะห์อาการเสีย]**
- วินิจฉัยว่าอาการนี้เกิดจากอะไร (ระบุสาเหตุที่เป็นไปได้ 2-3 ข้อ)
- ชิ้นส่วน/อะไหล่ตัวไหนที่น่าจะเสียหายหรือเสื่อมสภาพ
- ระดับความอันตราย (เช่น "อันตรายมาก ห้ามขับต่อ" หรือ "ยังพอขับไปอู่ได้")

👨‍🔧 **[แนวทางการแก้ไขและวิธีซ่อม]**
- สิ่งที่ผู้ใช้สามารถตรวจสอบหรือแก้ไขเบื้องต้นเองได้ (ถ้ามี)
- ขั้นตอนที่ช่างต้องทำในการรื้อเช็กหรือเปลี่ยนอะไหล่

💰 **[ประเมินค่าใช้จ่ายโดยประมาณ]**
- รายการอะไหล่ที่ต้องเปลี่ยน + ราคาโดยประมาณ (หน่วย: บาท) (ระบุด้วยว่าเป็นอะไหล่แท้หรือเทียม)
- ค่าบริการ/ค่าแรงช่างโดยประมาณ (หน่วย: บาท)
- สรุปยอดรวมงบประมาณที่ต้องเตรียมไว้ (ระบุทิ้งท้ายเสมอว่า "ราคาอาจเปลี่ยนแปลงตามพื้นที่และยี่ห้อรถ")

(หมายเหตุ: หากผู้ใช้พิมพ์มาสั้นเกินไปจนวิเคราะห์ไม่ได้ ให้สุภาพและถามข้อมูลเพิ่ม เช่น รุ่นรถ, ปี, หรืออาการร่วมอื่นๆ)`;

      // 🚀 เรียกใช้ AI ของ Cloudflare
      const aiResult = await cloudflareAI.run(
        "@cf/meta/llama-3.1-8b-instruct-fast",
        {
          messages: [
            { role: "user", content: systemPrompt }
          ]
        }
      );

      const aiResponseText = aiResult.response;

      // 📤 ส่งข้อมูลกลับ
      if (isFromFlutter) {
        return new Response(JSON.stringify({ 
          success: true, 
          analysis: aiResponseText 
        }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          }
        });
      } else if (chatId) {
        return await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: aiResponseText,
            parse_mode: "Markdown"
          })
        });
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}
