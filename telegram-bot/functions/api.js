export async function onRequestPost(context) {
  try {
    const request = context.request;
    const contentType = request.headers.get("content-type") || "";
    
    // ดึงค่า Telegram Token และออบเจกต์ AI ของ Cloudflare ออกมาใช้งาน
    const BOT_TOKEN = context.env.TELEGRAM_BOT_TOKEN;
    const cloudflareAI = context.env.AI; // 🎯 ตัวเชื่อมต่อ AI ในตัว Cloudflare
    
    let userMessage = "";
    let chatId = null;
    
    // ตรวจสอบว่าข้อความมาจาก Flutter หรือ Telegram
    const isFromFlutter = contentType.includes("application/json") && !request.headers.get("user-agent")?.includes("Telegram");

    if (isFromFlutter) {
      const body = await request.json();
      userMessage = body.dtc_code || body.message || "";
    } else {
      const payload = await request.json();
      if (payload.message && payload.message.text) {
        chatId = payload.message.chat.id;
        userMessage = payload.message.text;
      }
    }

    if (!userMessage.trim()) {
      return new Response(JSON.stringify({ error: "No message provided" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🧠 พรอมต์ช่างบอยอัจฉริยะล็อกโครงสร้างคำตอบ
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

    // 🚀 เรียกใช้สมองกล AI ของ Cloudflare โดยตรง (ใช้โมเดล Llama 3 ของ Meta ที่รันอยู่บนเซิร์ฟเวอร์ Cloudflare)
    const aiResult = await cloudflareAI.run(
      "@cf/meta/llama-3-8b-instruct",
      {
        messages: [
          { role: "user", content: systemPrompt }
        ]
      }
    );

    const aiResponseText = aiResult.response;

    // 📤 ส่งข้อมูลผลการวิเคราะห์กลับไปยังผู้ใช้งาน
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
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: aiResponseText,
          parse_mode: "Markdown"
        })
      });
      return new Response("OK", { status: 200 });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}