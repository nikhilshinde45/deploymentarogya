document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const languageSelector = document.getElementById('lang');

    // !!! IMPORTANT: Replace with your secure proxy URL !!!
    const API_PROXY_URL = 'http://localhost:3000/api/gemini-chat';
    const YOUR_API_KEY_PLACEHOLDER = 'AIzaSyDI6q3YdwMK7pxL3smThAuKD5WKTYavci4';

    // --- SYSTEM INSTRUCTION: note we enforce replies ONLY in selected language ---
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


    // Greetings / placeholders per language
    const greetings = {
        en: "Hello! How can I assist you today?",
        hi: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
        pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
    };

    const placeholders = {
        en: "Type your message here...",
        hi: "अपना संदेश यहाँ लिखें...",
        pa: "ਆਪਣਾ ਸੁਨੇਹਾ ਇੱਥੇ ਲਿਖੋ..."
    };

    // Prompts to tell user to use the selected language (displayed in that language)
    const langPrompts = {
        hi: "⚠️ कृपया हिंदी में लिखें।",
        pa: "⚠️ ਕਿਰਪਾ ਕਰਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਲਿਖੋ।",
        en: "⚠️ Please use English."
    };

    // Helper regex-based language detectors (script-based)
    function containsDevanagari(text) {
        return /[\u0900-\u097F]/.test(text);
    }
    function containsGurmukhi(text) {
        return /[\u0A00-\u0A7F]/.test(text);
    }

    // Append message and render **bold** and newlines
    function appendMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        const formattedMessage = String(message)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\n/g, '<br>'); // Newlines
        messageDiv.innerHTML = `<p>${formattedMessage}</p>`;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Helper to speak text aloud
    function speakText(text, langCode) {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel(); // Stop current speech
        // Clean text (remove markdown bold and newlines)
        const cleanText = text.replace(/\*\*/g, '').replace(/#/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        let targetLang = 'en-US';
        if (langCode === 'pa') targetLang = 'pa-IN';
        else if (langCode === 'hi') targetLang = 'hi-IN';
        
        utterance.lang = targetLang;
        
        // Find matching voice from system
        const voices = speechSynthesis.getVoices();
        const voiceMatch = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
        if (voiceMatch) {
            utterance.voice = voiceMatch;
        }
        
        speechSynthesis.speak(utterance);
    }
    
    // Trigger voice load
    if ('speechSynthesis' in window && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }

    // Update UI when language changes: placeholder + greeting
    function updateUIForLanguage(lang) {
        // Option: clear conversation on language change — uncomment if desired:
        // chatWindow.innerHTML = '';

        // update placeholder
        userInput.placeholder = placeholders[lang] || placeholders.en;

        // show greeting in selected language
        const greeting = greetings[lang] || greetings.en;
        appendMessage('bot', greeting);
        speakText(greeting, lang);
    }

    // Call this once on load
    updateUIForLanguage(languageSelector.value || 'en');

    // Change language when user selects
    languageSelector.addEventListener('change', (event) => {
        const lang = event.target.value || 'en';
        // Optionally clear old messages for a fresh start:
        chatWindow.innerHTML = '';
        updateUIForLanguage(lang);
    });

    // sendMessage with strict-language check
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        const selectedLang = languageSelector.value || 'en'; // en, hi, pa

        // Note: Strict language script checks removed to allow fallback voice transcription!
        // The prompt to Gemini already enforces the selected language safely.

        // Prepare user message for the model and display user input
        const userMessageForModel = `Respond ONLY in ${selectedLang}:\n${message}`;

        appendMessage('user', message);
        userInput.value = '';

        try {
            const response = await fetch(API_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "gemini-2.5-flash",
                    contents: [{ role: "user", parts: [{ text: userMessageForModel }] }],
                    systemInstruction: SYSTEM_INSTRUCTION,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
                    // do NOT send apiKey from client in production
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`API error ${response.status}: ${errData.error || response.statusText}`);
            }

            const data = await response.json();
            const botText = data.text || data.response || "Sorry, I couldn't get a response.";
            // Render bold and newlines
            const rendered = String(botText)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            appendMessage('bot', rendered);
            speakText(botText, selectedLang);

        } catch (error) {
            console.error('Error calling AI proxy:', error);
            appendMessage('bot', 'Oops! Something went wrong. Please try again later.');
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendMessage();
    });

    // --- Speech Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            micButton.classList.add('recording');
            userInput.placeholder = "Listening... Speak now.";
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            // Optionally auto-send the spoken message:
            sendMessage(); 
        };
        
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            micButton.classList.remove('recording');
            updateUIForLanguage(languageSelector.value || 'en');
        };
        
        recognition.onend = () => {
            micButton.classList.remove('recording');
            updateUIForLanguage(languageSelector.value || 'en');
        };
    }

    micButton.addEventListener('click', () => {
        if (!recognition) {
            alert("Your browser does not support voice input. Please try Google Chrome or Microsoft Edge.");
            return;
        }
        const langCode = languageSelector.value || 'en';
        if (langCode === 'pa') recognition.lang = 'pa-IN';
        else if (langCode === 'hi') recognition.lang = 'hi-IN';
        else recognition.lang = 'en-US';
        
        recognition.start();
    });

});
