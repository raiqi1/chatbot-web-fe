// chatbot-embed.js
(function () {
  "use strict";

  // Prevent double loading
  if (window.chatbotWidgetLoaded) return;
  window.chatbotWidgetLoaded = true;

  // GET USER ID FROM SCRIPT TAG
  function getUserIdFromScript() {
    const scripts = document.querySelectorAll('script[src*="chatbot-embed"]');
    for (let script of scripts) {
      const userId = script.getAttribute("data-user-id");
      if (userId) return userId;
    }
    return null;
  }

  // Configuration
  const CHATBOT_CONFIG = {
    apiUrl: "https://chatbotku.mooo.com",
    userId: getUserIdFromScript(),
    widget: {
      title: "Customer Service",
      subtitle: "Online • Siap membantu",
      welcomeMessage: "Halo! 👋 Ada yang bisa saya bantu?",
      placeholderText: "Ketik pesan Anda...",
      position: "bottom-right",
      colors: {
        primary: "#667eea",
        secondary: "#764ba2",
        text: "#333",
        background: "#ffffff",
      },
    },
    behavior: {
      autoOpen: false,
      showAfterScroll: false,
      rememberState: true,
      retryAttempts: 3,
      retryDelay: 1000,
    },
  };

  function validateUserConfig() {
    if (!CHATBOT_CONFIG.userId) {
      console.error("❌ Chatbot Error: data-user-id not found in script tag");
      return false;
    }
    console.log(`✅ Chatbot initialized for user: ${CHATBOT_CONFIG.userId}`);
    return true;
  }

  async function checkUserStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${CHATBOT_CONFIG.apiUrl}/embed/user/${CHATBOT_CONFIG.userId}/status`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("User status:", data);

      if (data.status === "user_not_found") {
        showUserNotFoundMessage();
        return false;
      } else if (data.status === "limited_ready" || !data.fully_personalized) {
        updateWelcomeMessage(
          `Hai ${data.user.name}! 👋 Saya siap membantu dengan info e-commerce umum. Upload dokumen untuk jawaban yang lebih personal! 📄`
        );
      } else if (data.chatbot_ready) {
        updateWelcomeMessage(
          `Hai ${data.user.name}! 👋 Saya siap membantu berdasarkan dokumen personal Anda.`
        );
      }

      return true;
    } catch (error) {
      console.warn("Error checking user status:", error);
      updateWelcomeMessage(
        "Halo! 👋 Saya siap membantu dengan pertanyaan Anda."
      );
      return true;
    }
  }

  function updateWelcomeMessage(message) {
    CHATBOT_CONFIG.widget.welcomeMessage = message;
  }

  function showUserNotFoundMessage() {
    const errorHTML = `
      <div id="chatbot-error-container" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #dc2626;
        padding: 20px;
        border-radius: 12px;
        border-left: 4px solid #dc2626;
        box-shadow: 0 10px 25px rgba(220, 38, 38, 0.15);
        max-width: 320px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 20px; margin-right: 8px;">⚠️</span>
          <strong>User Not Found</strong>
        </div>
        <div style="margin-bottom: 12px;">
          User <code style="background: rgba(220, 38, 38, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 12px;">${CHATBOT_CONFIG.userId}</code> belum terdaftar.
        </div>
        <div style="font-size: 13px; opacity: 0.9;">
          Hubungi admin untuk registrasi atau cek user ID Anda.
        </div>
        <button onclick="document.getElementById('chatbot-error-container').remove()" 
          style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: #dc2626; cursor: pointer; font-size: 18px; padding: 4px;">×</button>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", errorHTML);

    setTimeout(() => {
      const errorEl = document.getElementById("chatbot-error-container");
      if (errorEl) errorEl.remove();
    }, 15000);
  }

  // GENTLE CSS - No brutal resets, just specific overrides
  function injectStyles() {
    if (document.getElementById("chatbot-gentle-styles")) return;

    const styles = document.createElement("style");
    styles.id = "chatbot-gentle-styles";
    styles.textContent = `
      /* Chatbot Widget - Gentle Fix for Styled Components */
      .chatbot-widget-root {
        position: fixed;
        ${
          CHATBOT_CONFIG.widget.position.includes("bottom")
            ? "bottom: 20px;"
            : "top: 20px;"
        }
        ${
          CHATBOT_CONFIG.widget.position.includes("right")
            ? "right: 20px;"
            : "left: 20px;"
        }
        z-index: 999999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #333;
        direction: ltr;
        text-align: left;
      }
      
      .chatbot-widget-root * {
        box-sizing: border-box;
      }

      .chatbot-toggle-btn {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, ${
          CHATBOT_CONFIG.widget.colors.primary
        } 0%, ${CHATBOT_CONFIG.widget.colors.secondary} 100%);
        border: none;
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        outline: none;
      }

      .chatbot-toggle-btn:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.4);
      }

      .chatbot-toggle-btn:active {
        transform: scale(0.95);
      }

      .chatbot-toggle-btn svg {
        width: 30px;
        height: 30px;
        fill: white;
        transition: transform 0.3s ease;
      }

      .chatbot-toggle-btn.active svg {
        transform: rotate(45deg);
      }

      .chatbot-notification-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 22px;
        height: 22px;
        background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
        border-radius: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
        padding: 0 6px;
        box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
        animation: chatbot-pulse 2s infinite;
      }

      @keyframes chatbot-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      .chatbot-chat-window {
        position: absolute;
        ${
          CHATBOT_CONFIG.widget.position.includes("bottom")
            ? "bottom: 84px;"
            : "top: 84px;"
        }
        ${
          CHATBOT_CONFIG.widget.position.includes("right")
            ? "right: 0;"
            : "left: 0;"
        }
        width: 400px;
        height: 520px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1);
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #e1e5e9;
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .chatbot-chat-window.active {
        display: flex;
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .chatbot-header {
        background: linear-gradient(135deg, ${
          CHATBOT_CONFIG.widget.colors.primary
        } 0%, ${CHATBOT_CONFIG.widget.colors.secondary} 100%);
        color: white;
        padding: 18px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }

      .chatbot-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
        pointer-events: none;
      }

      .chatbot-header-info h3 {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        position: relative;
        z-index: 1;
      }

      .chatbot-header-info .status {
        font-size: 13px;
        opacity: 0.9;
        margin-top: 3px;
        position: relative;
        z-index: 1;
      }

      .chatbot-close-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        opacity: 0.8;
        transition: all 0.2s;
        position: relative;
        z-index: 1;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-close-btn:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      .chatbot-close-btn svg {
        width: 18px;
        height: 18px;
        fill: white;
      }

      .chatbot-messages {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        background: linear-gradient(to bottom, #f8f9fa 0%, #f1f3f4 100%);
        scroll-behavior: smooth;
      }

      .chatbot-message {
        margin-bottom: 18px;
        animation: chatbot-fadeInUp 0.4s ease-out;
        clear: both;
      }

      @keyframes chatbot-fadeInUp {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .chatbot-message.bot {
        text-align: left;
      }

      .chatbot-message.user {
        text-align: right;
      }

      .chatbot-message-bubble {
        display: inline-block;
        max-width: 85%;
        padding: 14px 18px;
        border-radius: 20px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
        white-space: pre-wrap;
        position: relative;
      }

      .chatbot-message.bot .chatbot-message-bubble {
        background: white;
        color: #333;
        border-bottom-left-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid #e8ebef;
      }

      .chatbot-message.user .chatbot-message-bubble {
        background: linear-gradient(135deg, ${
          CHATBOT_CONFIG.widget.colors.primary
        } 0%, ${CHATBOT_CONFIG.widget.colors.secondary} 100%);
        color: white;
        border-bottom-right-radius: 8px;
        box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
      }

      .chatbot-typing {
        display: none;
        margin-bottom: 18px;
        text-align: left;
      }

      .chatbot-typing.show {
        display: block;
      }

      .chatbot-typing-bubble {
        display: inline-block;
        padding: 14px 18px;
        background: white;
        border-radius: 20px;
        border-bottom-left-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid #e8ebef;
      }

      .chatbot-typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .chatbot-typing-dots span {
        width: 8px;
        height: 8px;
        background: linear-gradient(135deg, ${
          CHATBOT_CONFIG.widget.colors.primary
        } 0%, ${CHATBOT_CONFIG.widget.colors.secondary} 100%);
        border-radius: 50%;
        animation: chatbot-bounce 1.4s infinite ease-in-out;
      }

      .chatbot-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
      .chatbot-typing-dots span:nth-child(2) { animation-delay: -0.16s; }

      @keyframes chatbot-bounce {
        0%, 80%, 100% { 
          transform: scale(0.8); 
          opacity: 0.5; 
        }
        40% { 
          transform: scale(1.2); 
          opacity: 1; 
        }
      }

      .chatbot-input-area {
        padding: 20px 24px;
        background: white;
        border-top: 1px solid #e8ebef;
        display: flex;
        gap: 12px;
        align-items: flex-end;
      }

      .chatbot-input-field {
        flex: 1;
        border: 2px solid #e8ebef;
        border-radius: 24px;
        padding: 12px 18px;
        font-size: 14px;
        outline: none;
        resize: none;
        min-height: 44px;
        max-height: 120px;
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.4;
        transition: border-color 0.2s ease;
        background: #fafbfc;
        color: #333;
      }

      .chatbot-input-field:focus {
        border-color: ${CHATBOT_CONFIG.widget.colors.primary};
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .chatbot-input-field::placeholder {
        color: #9ca3af;
      }

      .chatbot-send-btn {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, ${
          CHATBOT_CONFIG.widget.colors.primary
        } 0%, ${CHATBOT_CONFIG.widget.colors.secondary} 100%);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        outline: none;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }

      .chatbot-send-btn:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .chatbot-send-btn:active:not(:disabled) {
        transform: scale(0.95);
      }

      .chatbot-send-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .chatbot-send-btn svg {
        width: 20px;
        height: 20px;
        fill: white;
      }

      .chatbot-error {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #dc2626;
        border-left: 4px solid #dc2626;
        border: 1px solid #fca5a5;
      }

      .chatbot-loading {
        pointer-events: none;
        opacity: 0.7;
      }

      .chatbot-connection-status {
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        z-index: 1000;
        display: none;
      }

      .chatbot-connection-status.show {
        display: block;
        animation: chatbot-fadeIn 0.3s ease;
      }

      @keyframes chatbot-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .chatbot-messages::-webkit-scrollbar {
        width: 8px;
      }

      .chatbot-messages::-webkit-scrollbar-track {
        background: #f1f3f4;
        border-radius: 4px;
      }

      .chatbot-messages::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, ${
          CHATBOT_CONFIG.widget.colors.primary
        } 0%, ${CHATBOT_CONFIG.widget.colors.secondary} 100%);
        border-radius: 4px;
      }

      .chatbot-messages::-webkit-scrollbar-thumb:hover {
        background: ${CHATBOT_CONFIG.widget.colors.secondary};
      }

      @media (max-width: 480px) {
        .chatbot-widget-root {
          bottom: 16px;
          right: 16px;
          left: 16px;
          top: auto;
        }

        .chatbot-chat-window {
          width: calc(100vw - 32px);
          height: 75vh;
          right: 0;
          left: 0;
          bottom: 84px;
        }

        .chatbot-toggle-btn {
          width: 56px;
          height: 56px;
        }

        .chatbot-toggle-btn svg {
          width: 26px;
          height: 26px;
        }
      }

      .chatbot-toggle-btn:focus,
      .chatbot-close-btn:focus,
      .chatbot-send-btn:focus {
        outline: 2px solid ${CHATBOT_CONFIG.widget.colors.primary};
        outline-offset: 2px;
      }
    `;

    document.head.appendChild(styles);
  }

  function createWidget() {
    const widgetHTML = `
      <div class="chatbot-widget-root" id="chatbot-widget-root">
        <div class="chatbot-connection-status" id="chatbot-connection-status">
          Connecting...
        </div>

        <button class="chatbot-toggle-btn" id="chatbot-toggle-btn" aria-label="Open customer service chat">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.53 3.5-3.5V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
          </svg>
        </button>

        <div class="chatbot-chat-window" id="chatbot-chat-window" role="dialog" aria-labelledby="chatbot-title">
          <div class="chatbot-header">
            <div class="chatbot-header-info">
              <h3 id="chatbot-title">${CHATBOT_CONFIG.widget.title}</h3>
              <div class="status">${CHATBOT_CONFIG.widget.subtitle}</div>
            </div>
            <button class="chatbot-close-btn" id="chatbot-close-btn" aria-label="Close chat">
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <div class="chatbot-messages" id="chatbot-messages" aria-live="polite">
            <div class="chatbot-message bot">
              <div class="chatbot-message-bubble" id="chatbot-welcome-message">
                ${CHATBOT_CONFIG.widget.welcomeMessage}
              </div>
            </div>
          </div>

          <div class="chatbot-typing" id="chatbot-typing">
            <div class="chatbot-typing-bubble">
              <div class="chatbot-typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div class="chatbot-input-area">
            <textarea 
              class="chatbot-input-field" 
              id="chatbot-input-field" 
              placeholder="${CHATBOT_CONFIG.widget.placeholderText}"
              rows="1"
              maxlength="1000"
              aria-label="Type your message"></textarea>
            <button class="chatbot-send-btn" id="chatbot-send-btn" aria-label="Send message" disabled>
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", widgetHTML);
  }

  function initializeWidget() {
    const elements = {
      toggle: document.getElementById("chatbot-toggle-btn"),
      window: document.getElementById("chatbot-chat-window"),
      close: document.getElementById("chatbot-close-btn"),
      input: document.getElementById("chatbot-input-field"),
      send: document.getElementById("chatbot-send-btn"),
      messages: document.getElementById("chatbot-messages"),
      typing: document.getElementById("chatbot-typing"),
      welcomeMessage: document.getElementById("chatbot-welcome-message"),
      connectionStatus: document.getElementById("chatbot-connection-status"),
    };

    let isOpen = false;
    let messageCount = 0;
    let retryCount = 0;
    let isConnected = true;

    // Load saved state
    if (CHATBOT_CONFIG.behavior.rememberState) {
      const savedState = localStorage.getItem("chatbot-open");
      isOpen = savedState === "true";
      if (isOpen) {
        toggleChat(true);
      }
    }

    // Enable send button when input has content
    elements.input.addEventListener("input", () => {
      const hasContent = elements.input.value.trim().length > 0;
      elements.send.disabled = !hasContent;
      handleInputResize();
    });

    // Auto-open behavior
    if (CHATBOT_CONFIG.behavior.autoOpen && !isOpen) {
      setTimeout(() => toggleChat(true), 2000);
    }

    // Event listeners
    elements.toggle.addEventListener("click", () => toggleChat());
    elements.close.addEventListener("click", () => toggleChat(false));

    // Input handling
    elements.input.addEventListener("keydown", handleInputKeydown);
    elements.send.addEventListener("click", sendMessage);

    function toggleChat(forceState = null) {
      isOpen = forceState !== null ? forceState : !isOpen;

      elements.toggle.classList.toggle("active", isOpen);
      elements.window.classList.toggle("active", isOpen);

      if (isOpen) {
        setTimeout(() => elements.input.focus(), 300);
        removeNotificationBadge();
        messageCount = 0;
      }

      // Save state
      if (CHATBOT_CONFIG.behavior.rememberState) {
        localStorage.setItem("chatbot-open", isOpen.toString());
      }
    }

    function handleInputResize() {
      elements.input.style.height = "auto";
      elements.input.style.height =
        Math.min(elements.input.scrollHeight, 120) + "px";
    }

    function handleInputKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!elements.send.disabled) {
          sendMessage();
        }
      }
    }

    async function sendMessage() {
      const message = elements.input.value.trim();
      if (!message || elements.send.disabled) return;

      // Disable send button and show loading state
      elements.send.disabled = true;
      elements.window.classList.add("chatbot-loading");

      // Add user message
      addMessage(message, "user");

      // Clear and reset input
      elements.input.value = "";
      elements.input.style.height = "auto";

      // Show typing indicator
      showTyping(true);

      try {
        await attemptSendMessage(message);
        retryCount = 0;
        setConnectionStatus(true);
      } catch (error) {
        console.error("Failed to send message:", error);
        await handleMessageError(message, error);
      } finally {
        showTyping(false);
        elements.send.disabled = false;
        elements.window.classList.remove("chatbot-loading");
      }
    }

    async function attemptSendMessage(message, attempt = 1) {
      try {
        showConnectionStatus(
          `Sending... (${attempt}/${CHATBOT_CONFIG.behavior.retryAttempts})`
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const formData = new FormData();
        formData.append("question", message);

        const response = await fetch(
          `${CHATBOT_CONFIG.apiUrl}/embed/chat/${CHATBOT_CONFIG.userId}`,
          {
            method: "POST",
            body: formData,
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        clearTimeout(timeoutId);
        hideConnectionStatus();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === "error") {
          throw new Error(data.message || "Server error occurred");
        }

        if (!data.answer || data.answer.length < 2) {
          throw new Error("Invalid response received");
        }

        addMessage(data.answer, "bot");
        trackMessage(message, data.answer);
      } catch (error) {
        if (
          attempt < CHATBOT_CONFIG.behavior.retryAttempts &&
          error.name !== "AbortError"
        ) {
          console.warn(`Attempt ${attempt} failed, retrying...`, error);
          await new Promise((resolve) =>
            setTimeout(resolve, CHATBOT_CONFIG.behavior.retryDelay * attempt)
          );
          return attemptSendMessage(message, attempt + 1);
        }
        throw error;
      }
    }

    async function handleMessageError(originalMessage, error) {
      setConnectionStatus(false);
      retryCount++;

      let errorMessage = "";

      if (error.name === "AbortError") {
        errorMessage =
          detectLanguage(originalMessage) === "indonesian"
            ? "⏰ Koneksi timeout. Coba lagi ya!"
            : "⏰ Connection timeout. Please try again!";
      } else if (error.message.includes("HTTP 5")) {
        errorMessage =
          detectLanguage(originalMessage) === "indonesian"
            ? "🔧 Server sedang maintenance. Coba beberapa saat lagi!"
            : "🔧 Server maintenance. Please try again later!";
      } else if (error.message.includes("network") || !navigator.onLine) {
        errorMessage =
          detectLanguage(originalMessage) === "indonesian"
            ? "📡 Cek koneksi internet kamu ya!"
            : "📡 Please check your internet connection!";
      } else {
        errorMessage =
          detectLanguage(originalMessage) === "indonesian"
            ? "❌ Maaf, ada gangguan teknis. Coba lagi nanti ya!"
            : "❌ Sorry, technical issue occurred. Please try again later!";
      }

      addMessage(errorMessage, "bot", true);
    }

    function addMessage(text, sender, isError = false) {
      const messageDiv = document.createElement("div");
      messageDiv.className = `chatbot-message ${sender}`;

      const bubbleDiv = document.createElement("div");
      bubbleDiv.className = `chatbot-message-bubble ${
        isError ? "chatbot-error" : ""
      }`;
      bubbleDiv.textContent = text;

      messageDiv.appendChild(bubbleDiv);
      elements.messages.appendChild(messageDiv);

      // Auto-scroll to bottom
      elements.messages.scrollTop = elements.messages.scrollHeight;

      // If window is closed and it's a bot message, show notification
      if (!isOpen && sender === "bot") {
        messageCount++;
        addNotificationBadge();
      }
    }

    function showTyping(show) {
      elements.typing.classList.toggle("show", show);
      if (show) {
        elements.messages.scrollTop = elements.messages.scrollHeight;
      }
    }

    function addNotificationBadge() {
      if (elements.toggle.querySelector(".chatbot-notification-badge")) return;

      const badge = document.createElement("div");
      badge.className = "chatbot-notification-badge";
      badge.textContent = messageCount > 99 ? "99+" : messageCount.toString();
      elements.toggle.appendChild(badge);
    }

    function removeNotificationBadge() {
      const badge = elements.toggle.querySelector(
        ".chatbot-notification-badge"
      );
      if (badge) badge.remove();
    }

    function setConnectionStatus(connected) {
      isConnected = connected;
      const statusElement = elements.connectionStatus;

      if (connected) {
        statusElement.textContent = "✅ Connected";
        statusElement.style.background = "rgba(34, 197, 94, 0.9)";
      } else {
        statusElement.textContent = "❌ Connection Error";
        statusElement.style.background = "rgba(239, 68, 68, 0.9)";
      }
    }

    function showConnectionStatus(message) {
      elements.connectionStatus.textContent = message || "Connecting...";
      elements.connectionStatus.classList.add("show");
    }

    function hideConnectionStatus() {
      setTimeout(() => {
        elements.connectionStatus.classList.remove("show");
      }, 1000);
    }

    function detectLanguage(text) {
      const indonesianWords = [
        "apa",
        "bagaimana",
        "gimana",
        "bisa",
        "gak",
        "tidak",
        "dengan",
        "untuk",
        "dari",
        "dan",
        "kok",
        "sih",
        "dong",
      ];
      const englishWords = [
        "what",
        "how",
        "can",
        "could",
        "would",
        "the",
        "and",
        "with",
        "for",
        "from",
        "when",
        "where",
      ];

      const textLower = text.toLowerCase();
      const idScore = indonesianWords.filter((word) =>
        textLower.includes(word)
      ).length;
      const enScore = englishWords.filter((word) =>
        textLower.includes(word)
      ).length;

      return idScore > enScore ? "indonesian" : "english";
    }

    function trackMessage(userMessage, botResponse) {
      if (typeof gtag !== "undefined") {
        gtag("event", "chatbot_interaction", {
          event_category: "chatbot",
          event_label: "message_sent",
          user_id: CHATBOT_CONFIG.userId,
          custom_parameter: {
            message_length: userMessage.length,
            response_length: botResponse.length,
            language: detectLanguage(userMessage),
          },
        });
      }

      if (typeof analytics !== "undefined" && analytics.track) {
        analytics.track("Chatbot Message", {
          userId: CHATBOT_CONFIG.userId,
          messageLength: userMessage.length,
          responseLength: botResponse.length,
          language: detectLanguage(userMessage),
        });
      }
    }

    function updateWelcomeMessageElement(message) {
      if (elements.welcomeMessage) {
        elements.welcomeMessage.textContent = message;
      }
    }

    // Enhanced widget API
    window.ChatbotWidget = {
      open: () => toggleChat(true),
      close: () => toggleChat(false),
      toggle: () => toggleChat(),
      sendMessage: (msg) => {
        elements.input.value = msg;
        elements.send.disabled = false;
        sendMessage();
      },
      isOpen: () => isOpen,
      isConnected: () => isConnected,
      getUserId: () => CHATBOT_CONFIG.userId,
      updateWelcome: updateWelcomeMessageElement,
      getMessageCount: () => elements.messages.children.length - 1,
      clearChat: () => {
        // Keep only welcome message
        const welcomeMsg = elements.messages.children[0];
        elements.messages.innerHTML = "";
        elements.messages.appendChild(welcomeMsg);
        messageCount = 0;
        removeNotificationBadge();
      },
      retryLastMessage: () => {
        const messages = Array.from(elements.messages.children);
        const lastUserMessage = messages
          .reverse()
          .find((msg) => msg.classList.contains("user"));
        if (lastUserMessage) {
          const messageText = lastUserMessage.querySelector(
            ".chatbot-message-bubble"
          ).textContent;
          elements.input.value = messageText;
          elements.send.disabled = false;
          sendMessage();
        }
      },
    };

    console.log("✅ Gentle chatbot widget initialized successfully!");
  }

  async function init() {
    try {
      // Check if already initialized
      if (document.getElementById("chatbot-widget-root")) {
        console.warn("Chatbot widget already initialized");
        return;
      }

      // Validate user configuration
      if (!validateUserConfig()) {
        return;
      }

      // Check user status
      const userValid = await checkUserStatus();
      if (!userValid) {
        return;
      }

      // Initialize widget
      injectStyles();
      createWidget();
      initializeWidget();

      console.log(
        `✅ Gentle chatbot widget initialized for user: ${CHATBOT_CONFIG.userId}`
      );
    } catch (error) {
      console.error("Failed to initialize chatbot widget:", error);

      // Show minimal error message
      const errorHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 14px; max-width: 300px; z-index: 999999; font-family: system-ui;">
          <strong>Chatbot Error</strong><br>
          Failed to initialize. Please refresh the page.
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", errorHTML);
    }
  }

  // Initialize when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Handle online/offline events
  window.addEventListener("online", () => {
    console.log("Connection restored");
    if (window.ChatbotWidget) {
      // Could trigger a reconnection check here
    }
  });

  window.addEventListener("offline", () => {
    console.log("Connection lost");
  });
})();
