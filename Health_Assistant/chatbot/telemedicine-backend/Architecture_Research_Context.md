# Voice-Enabled, Multilingual Telemedicine AI Chatbot

Based on the structure of your system, your project is a **Voice-Enabled, Multilingual Telemedicine AI Chatbot**. It uses a client-server architecture acting as a broker between the user's browser, relying on native Web APIs for voice integration, and a Large Language Model (Google Gemini) for the reasoning engine.

Here is a detailed breakdown of the implementation tech stack and system architecture that you can adapt directly for your research paper.

## 1. Technology Stack

Your tech stack is intentionally lightweight, leveraging browser-native APIs and a fast Node server rather than heavy frontend frameworks.

### Frontend (Client-Side)
*   **Core UI Elements:** HTML5 and CSS3 (implemented via `index.html` and `style.css`) to create a responsive, chat-like interface. 
*   **Logic Engine:** Vanilla JavaScript (`script.js`) to handle DOM manipulation, event listening, and state management without the overhead of frameworks like React or Angular.
*   **Voice Integration APIs:** 
    *   **Web Speech API (`SpeechRecognition`)**: Used for Speech-to-Text (STT) capabilities. It captures microphone input and transcribes it into text, configured with dynamic BCP-47 language tags (`hi-IN`, `pa-IN`, `en-US`) matching the user's selection.
    *   **Web Speech API (`speechSynthesis`)**: Used for Text-to-Speech (TTS). It selects appropriate neural or local voices based on the localized dialect to read out the AI's response aloud.
*   **Network Requests:** The native JavaScript `Fetch API` is used to make asynchronous HTTP POST requests to the backend server.

### Backend (Server-Side)
*   **Runtime:** Node.js, providing an asynchronous, event-driven JavaScript environment.
*   **Framework:** Express.js (`server.js`), utilized to quickly set up a web server and handle API routing.
*   **Security & Middleware:**
    *   **dotenv**: Stores the sensitive `GEMINI_API_KEY` in environment variables strictly on the server-side.
    *   **cors**: Middleware to securely handle Cross-Origin Resource Sharing.
    *   **express.static**: Used to serve the static frontend client files from the backend host.

### Artificial Intelligence Engine
*   **Model:** Google Generative AI (`gemini-2.5-flash`), accessible via the `@google/generative-ai` SDK. This acts as the reasoning brain of the system, handling diagnosis and recommendations.

---

## 2. System Architecture

The project employs a **3-Tier Proxy Architecture**, which ensures robust security for your API keys while providing a seamless user experience.

1.  **Presentation Tier (The Browser):** Handles user interaction (voice or typing), renders Markdown responses, and reads output aloud.
2.  **Proxy Tier (Node.js Server):** Acts as a secure middleware. It receives the text prompt from the frontend, securely injects the API key locally, and relays it down the pipeline.
3.  **Intelligence Tier (Cloud AI):** Google’s architecture processes the prompt alongside rigorous system instructions to generate a safe, reliable medical response.

### Data Flow Model
If a user uses the voice feature, the transaction mapping operates synchronously as follows:
1.  **Audio Capture:** The user clicks the microphone button triggering `recognition.start()`. The Web Speech API converts the audio waveform into a text string (STT).
2.  **Client-Side Dispatch:** `script.js` bundles the transcribed text and the user's language selection, formatting it clearly into a `userMessageForModel`. 
3.  **Proxy Forwarding:** The frontend makes a POST request to the local backend route (`/api/gemini-chat`). 
4.  **AI Inference:** The Express server isolates the request payload, establishes a connection using the `GoogleGenerativeAI` client, and submits it to the `gemini-2.5-flash` model. 
5.  **Response Construction:** The AI processes the response based on the `SYSTEM_INSTRUCTION` (which strictly bounds the AI to be a registered doctor answering only medical queries and applying localized language formats). 
6.  **Client Rendering:** The server relays the response text back to the client. The client's JavaScript parses any Markdown styling (such as converting `**bold**` into `<strong>` tags).
7.  **Auditory Feedback:** Upon mapping the response to the DOM, `script.js` creates a new `SpeechSynthesisUtterance`, strips out markdown characters so they are not spoken aloud, matches a system voice profile to the language code, and vocalizes the result to the user.

---

## 3. Implementation Context (For Your Paper)

When documenting the implementation in your research approach, you can emphasize these key software engineering decisions:

*   **Zero-Trust Security Practice:** In implementing AI features on the web, a catastrophic vulnerability is exposing the LLM API limit to the broader internet. By creating a Node.js Proxy Server (`server.js`), the architecture applies the **Backend-for-Frontend (BFF)** pattern, physically separating client-side logic from the authentication layer. 
*   **Prompt Engineering & Persona Hardening:** You've implemented a robust "System Prompting" strategy. By injecting a `SYSTEM_INSTRUCTION` file into every request parameter, the LLM is forcibly fine-tuned "in-context." It strictly acts as a health assistant, has safeguard clauses for non-medical inputs ("I am a medical assistant..."), and governs the resulting output into an exact format (ex. explanation followed by a numbered list).
*   **Accessibility via Multimodal Inputs:** The traditional text-based chatbot is transformed into an accessible conversational agent by harnessing the `window.SpeechRecognition` and `window.speechSynthesis` event classes. This opens up telemedicine reachability to users dealing with lower digital literacy, literacy barriers, or visual impairments.
