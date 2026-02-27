"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function askOracle(rawText: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Updated Prompt for Turkish Context
    const prompt = `
    Sen "Oracle" adında elit bir tıbbi çalışma asistanısın.
    Aşağıdaki ham notları/transkripti yapılandırılmış bir Tıbbi Protokol haline getir.
    
    Çıktı Kuralları (Tiptap Editörü için Strict HTML):
    1. DİL: Kesinlikle TÜRKÇE kullan. Tıbbi terminolojiye (Latince/Türkçe) sadık kal.
    2. <h3> etiketi: Ana başlıklar için (örn. Tanı, Tedavi, Klinik Tablo).
    3. <ul> ve <li> etiketleri: Listeler için.
    4. <strong> etiketi: Kritik tıbbi terimler, dozajlar ve semptomlar için.
    5. Görsel Önerisi: Eğer bir anatomi, histoloji veya şema gerektiren karmaşık bir bölüm varsa, şu formatta bir alıntı ekle:
       <blockquote class="callout-block" style="border-color: #D4AF37; background: rgba(212,175,55,0.05);">
          <strong>🏗️ Oracle Görüşü:</strong> Bu bölüm (${rawText.substring(0, 10)}...) karmaşık görünüyor. Buraya bir anatomi şeması veya oklüzyon kartı eklemeyi düşün.
       </blockquote>
    6. Markdown kullanma. SADECE raw HTML string döndür.
    7. TUS (Tıpta Uzmanlık Sınavı) formatına uygun, kısa ve yüksek verimli notlar oluştur. Ancak notları kısaltırken bilgilerden kısma. Verilen kaynaktaki bütün bilgileri notta bulundur.

    Ham Metin:
    "${rawText}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```html/g, '').replace(/```/g, '');

    return { success: true, content: text };
  } catch (error) {
    console.error("Oracle Error:", error);
    return { success: false, error: "Oracle yanıt vermedi (API Hatası)." };
  }
}