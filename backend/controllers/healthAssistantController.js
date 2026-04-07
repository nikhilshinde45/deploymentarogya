const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;

let genAI;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  console.warn('GEMINI_API_KEY not set – Health Assistant will be unavailable.');
}

const SYSTEM_INSTRUCTION = `
You are a caring **doctor chatbot**. Follow these rules strictly:

1. Respond **only to health-related questions**. Do not answer any non-medical queries.
2. Use proper formatting:
   - Explanation first, followed by numbered recommendations.
   - Each number on a new line.
   - Highlight important keywords in **bold**.
   - Split long recommendations so bold words are clear.
3. Supported languages: English (en), Hindi (hi), Punjabi (pa). Respond ONLY in the language selected by the user. Never switch languages.
4. For common viral illnesses (fever, cold, flu):
   - Suggest simple medicines such as **Paracetamol** if needed.
   - Recommend **rest**, hydration, and self-care.
5. Do not suggest prescription-only or serious medications.
6. If symptoms are severe or unusual, instruct the user to **consult a doctor immediately**.
7. If the user asks anything non-medical, reply:
   - English: "⚠ I am a medical assistant and can only answer health-related questions."
   - Hindi: "⚠ मैं केवल स्वास्थ्य संबंधी प्रश्नों का उत्तर दे सकता हूँ।"
   - Punjabi: "⚠ ਮੈਂ ਸਿਰਫ਼ ਸਿਹਤ ਸਬੰਧੀ ਸਵਾਲਾਂ ਦਾ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ।"

Examples:

English:
It may be a **viral fever**...
1. Take plenty of **rest**.
2. Drink lots of **water**.
3. Take **Paracetamol** if temperature is high.

Hindi:
यह **वायरल बुखार** हो सकता है...
1. पर्याप्त **आराम** करें।
2. बहुत **पानी** पिएँ।
3. बुखार अधिक होने पर **पैरासिटामोल** लें।

Punjabi:
ਇਹ **ਵਾਇਰਲ ਬੁਖਾਰ** ਹੋ ਸਕਦਾ ਹੈ...
1. ਕਾਫ਼ੀ **ਆਰਾਮ** ਕਰੋ।
2. ਬਹੁਤ ਸਾਰਾ **ਪਾਣੀ** ਪੀਓ।
3. ਬੁਖਾਰ ਵੱਧ ਹੋਣ 'ਤੇ **ਪੈਰਾਸਿਟਾਮੋਲ** ਲਵੋ।
`;

/**
 * POST /api/health-assistant/chat
 * Body: { message: string, language?: 'en' | 'hi' | 'pa' }
 * Response: { reply: string }
 */
const chatWithAssistant = async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({
        reply: 'Sorry, the Health Assistant is currently unavailable. Please try again later.',
      });
    }

    const { message, language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ reply: 'Please provide a valid message.' });
    }

    const userMessageForModel = `Respond ONLY in ${language}:\n${message.trim()}`;

    const aiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await aiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessageForModel }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
    });

    const response = result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error('Health Assistant error:', error.message);
    res.status(500).json({
      reply: 'Sorry, something went wrong. Please try again later.',
    });
  }
};

module.exports = { chatWithAssistant };
