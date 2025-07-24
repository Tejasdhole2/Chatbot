// script.js

const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const menuButton = document.querySelector("#close-chatbot");
const popupMenu = document.querySelector(".chat-menu");

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null
  }
};

const API_KEY = "AIzaSyAirQLJqLj95THYqvfrCgYDMNQVPIR4Uxw";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");
  const userPrompt = userData.message.toLowerCase();

  // Check for image generation intent
  const isImageRequest = userPrompt.includes("generate an image of");

  if (isImageRequest) {
    const searchTerm = userPrompt.split("generate an image of")[1].trim().replace(/\s+/g, "-");
    const imageUrl = `https://source.unsplash.com/featured/?${searchTerm}`;
    messageElement.innerHTML = `<strong>Generated Image:</strong><br><img src="${imageUrl}" style="max-width: 100%; border-radius: 12px; margin-top: 8px;">`;
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    return;
  }

  // Standard Gemini response
  const requestOption = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: userData.message },
          ...(userData.file.data ? [{ inline_data: userData.file }] : [])
        ]
      }]
    })
  };

  try {
    const response = await fetch(API_URL, requestOption);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponseText = data.candidates[0].content.parts[0].text;
    messageElement.innerHTML = marked.parse(apiResponseText);
    hljs.highlightAll();
  } catch (error) {
    console.error(error);
    messageElement.innerText = "Error: " + error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message) return;
  messageInput.value = "";
  fileUploadWrapper.classList.remove("file-uploaded");

  const messageContent = `<div class="message-text"></div>${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;
  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const messageContent = `
      <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9z"/>
      </svg>
      <div class="message-text">
        <div class="thinking-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>`;
    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    generateBotResponse(incomingMessageDiv);
  }, 600);
};

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && messageInput.value.trim()) {
    handleOutgoingMessage(e);
  }
});

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];
    userData.file = {
      data: base64String,
      mime_type: file.type
    };
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  }
});

document.querySelector(".chat-form").appendChild(picker);

menuButton.addEventListener("click", () => {
  popupMenu.classList.toggle("visible");
});

document.addEventListener("click", (e) => {
  if (!popupMenu.contains(e.target) && e.target !== menuButton) {
    popupMenu.classList.remove("visible");
  }
});
