# Telemedicine Chatbot Architecture & Documentation

Welcome to the documentation for your Telemedicine AI Chatbot! This document will explain exactly how your project is structured, what each file does, and how the data flows from the user to the AI and back.

## 📁 Why do you see `._script` and `._server` files?
Before we dive into the code, let's address the `._script` and `._server` files. 
These files are **macOS "Resource Fork" files** (sometimes called AppleDouble files). When somebody creates a `.zip` file or copies folders on an Apple Mac computer, macOS automatically creates these hidden `._` files to store extra icon and file-system information.

**You cannot open them as code because they aren't code!** You can safely ignore or even delete any file starting with `._` or any folder named `__MACOSX`. They do not affect your application at all.

---

## 🏗️ Project Overview
This chatbot is a full-stack web application. It consists of two main parts:
1. **The Frontend (Client)**: The user interface where users type messages and see responses. It runs securely in the user's web browser.
2. **The Backend (Server)**: A Node.js server that acts as a secure "middleman" between the frontend and the Google Gemini AI.

### Why do we need a Backend?
If the frontend talked directly to Google Gemini, you would have to put your secret `GEMINI_API_KEY` directly inside `script.js`. Because `script.js` is sent to the user's browser, *anyone* could steal your API key. The backend solves this by hiding the API key safely on the server.

---

## 📄 File-by-File Breakdown

### 1. `index.html` (The Skeleton)
**Purpose:** Defines the structure of the webpage.
**How it works:**
- It includes a `<select>` dropdown menu with English, Hindi, and Punjabi options.
- It provides an empty container `<div id="chat-window">` where the chat messages will dynamically appear.
- It provides a text input box `<input type="text" id="user-input">` and a "Send" button.
- It links to `style.css` for visuals and `script.js` for the logic.

### 2. `style.css` (The Makeover)
**Purpose:** Makes the chatbot look beautiful.
**How it works:**
- Applies fonts, colors, padding, and alignments to the skeleton created by `index.html`.
- Styles the user messages differently (e.g., aligning user messages to the right in a blue bubble, and bot messages to the left in a gray bubble) to make it look like a real messaging app like WhatsApp or iMessage.

### 3. `script.js` (The Brain of the User Interface)
**Purpose:** Handles all user interactions, language validation, and talks to your backend.
**How it works:**
- **System Instructions**: Defines rules that tell Gemini to act like a doctor, restrict answers to medical questions, and never prescribe heavy medications.
- **Event Listeners**: It waits for the user to click the "Send" button or press "Enter".
- **Language Checking**: When a message is sent, it ensures the user actually typed in the script they selected in the dropdown:
  - If "Hindi" is selected, it checks if the text contains Devanagari script using regular expressions (regex).
  - If "Punjabi" is selected, it checks for Gurmukhi script.
  - If they use the wrong script, it warns them and stops the message from sending.
- **API Call**: If the message is valid, it sends the message and the strict System Instructions to your backend (`http://localhost:3000/api/gemini-chat`) using a `fetch()` request.
- **Displaying Responses**: Once the backend replies, it formats the text (making things bold if they have `**` around them and handling new lines) and pushes it to the chat window.

### 4. `server.js` (The Secure Middleman)
**Purpose:** Hosts the local server, protects the API key, and communicates with Google Gemini.
**How it works:**
- **Express.js**: Uses the standard Node.js Express framework to spin up a web server on port 3000.
- **Dotenv**: `require('dotenv').config()` pulls your secret API key from the `.env` file so the code can use it securely without the key being written directly in the code file.
- **Static File Serving**: `app.use(express.static(__dirname))` tells the server to serve `index.html`, `style.css`, and `script.js` when someone opens `http://localhost:3000/`.
- **The POST Route (`/api/gemini-chat`)**: 
  - Receives the message and system instructions from the frontend.
  - Initializes the Google Generative AI SDK using your secure API key.
  - Bundles the information and sends it to Google's servers.
  - Awaits the AI's response and sends that response text straight back down to your frontend.

### 5. `.env` (The Vault)
**Purpose:** A hidden file to store your secrets.
**How it works:**
- Contains exactly one important line: `GEMINI_API_KEY=your_key_here`. 
- Because this file is never sent to the browser or uploaded publicly, hackers cannot easily steal your API limits/billing credentials.

---

## 🔄 The Complete "Message Flow" Step-by-Step
1. **User types**: "I have a headache" and clicks Send.
2. **Frontend (`script.js`)**: Validates the language. All good.
3. **Frontend (`script.js`)**: Makes a `POST` request to `/api/gemini-chat` containing the message.
4. **Backend (`server.js`)**: Receives the request. Extracts the text.
5. **Backend (`server.js`)**: Securely attaches the `GEMINI_API_KEY` and forwards the message to Google's actual servers.
6. **Google Gemini**: Uses AI to generate a medical-only recommendation: "1. Rest. 2. Drink water."
7. **Backend (`server.js`)**: Receives the response from Google and immediately relays it back to `script.js`.
8. **Frontend (`script.js`)**: Renders the text on the screen in a chat bubble for the user.

And that's it! Your chatbot successfully bridges the gap between a sleek front-end interface, a secure backend, and powerful AI.
