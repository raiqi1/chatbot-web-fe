// chatbot-iframe-embed.js - IFRAME VERSION
(function () {
  "use strict";

  // Prevent double loading
  if (window.chatbotIframeLoaded) return;
  window.chatbotIframeLoaded = true;

  // GET USER ID FROM SCRIPT TAG
  function getUserIdFromScript() {
    const scripts = document.querySelectorAll(
      'script[src*="chatbot-iframe-embed"]'
    );
    for (let script of scripts) {
      const userId = script.getAttribute("data-user-id");
      if (userId) return userId;
    }
    return null;
  }

  // Configuration
  const CHATBOT_CONFIG = {
    iframeUrl: "http://localhost:3001/chatbot-widget.html",
    userId: getUserIdFromScript(),
    widget: {
      position: "bottom-right", // bottom-right, bottom-left, top-right, top-left
      colors: {
        primary: "#667eea",
        secondary: "#764ba2",
      },
      title: "Customer Service Iframe",
      subtitle: "Online • Siap membantu",
      welcomeMessage: "Halo! 👋 Ada yang bisa saya bantu?",
      placeholderText: "Ketik pesan Anda...",
    },
    behavior: {
      autoOpen: false,
      showAfterScroll: false,
      rememberState: true,
    },
  };

  function validateUserConfig() {
    if (!CHATBOT_CONFIG.userId) {
      console.error("❌ Chatbot Error: data-user-id not found in script tag");
      return false;
    }
    console.log(
      `✅ Chatbot iframe initialized for user: ${CHATBOT_CONFIG.userId}`
    );
    return true;
  }

  // INJECT IFRAME CONTAINER STYLES
  function injectStyles() {
    if (document.getElementById("chatbot-iframe-styles")) return;

    const styles = document.createElement("style");
    styles.id = "chatbot-iframe-styles";
    styles.textContent = `
      /* Chatbot Iframe Container */
      .chatbot-iframe-container {
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
        font-family: system-ui, -apple-system, sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .chatbot-iframe-toggle {
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
      }

      .chatbot-iframe-toggle:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.4);
      }

      .chatbot-iframe-toggle svg {
        width: 30px;
        height: 30px;
        fill: white;
        transition: transform 0.3s ease;
      }

      .chatbot-iframe-toggle.active svg {
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

      .chatbot-iframe-widget {
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
        border: none;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        display: none;
        background: white;
        overflow: hidden;
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .chatbot-iframe-widget.active {
        display: block;
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .chatbot-loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        border-radius: 16px;
      }

      .chatbot-loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid ${CHATBOT_CONFIG.widget.colors.primary};
        border-radius: 50%;
        animation: chatbot-spin 1s linear infinite;
      }

      @keyframes chatbot-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .chatbot-error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        z-index: 1001;
        border-radius: 16px;
        color: #dc2626;
        text-align: center;
        padding: 20px;
      }

      .chatbot-retry-btn {
        margin-top: 12px;
        background: #dc2626;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }

      .chatbot-retry-btn:hover {
        background: #b91c1c;
      }

      /* Mobile Responsive */
      @media (max-width: 480px) {
        .chatbot-iframe-container {
          bottom: 16px;
          right: 16px;
          left: 16px;
        }

        .chatbot-iframe-widget {
          width: calc(100vw - 32px);
          height: 70vh;
          right: 0;
          left: 0;
          bottom: 84px;
        }

        .chatbot-iframe-toggle {
          width: 56px;
          height: 56px;
        }

        .chatbot-iframe-toggle svg {
          width: 26px;
          height: 26px;
        }
      }

      /* Hide scrollbars on iframe container */
      .chatbot-iframe-widget {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      
      .chatbot-iframe-widget::-webkit-scrollbar {
        display: none;
      }
    `;

    document.head.appendChild(styles);
  }

  function createWidget() {
    const containerHTML = `
      <div class="chatbot-iframe-container" id="chatbot-iframe-container">
        <button class="chatbot-iframe-toggle" id="chatbot-iframe-toggle" aria-label="Open customer service chat">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.53 3.5-3.5V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
          </svg>
        </button>

        <div class="chatbot-iframe-widget" id="chatbot-iframe-widget">
          <div class="chatbot-loading-overlay" id="chatbot-loading-overlay">
            <div class="chatbot-loading-spinner"></div>
          </div>
          
          <div class="chatbot-error-overlay" id="chatbot-error-overlay" style="display: none;">
            <div>⚠️ <strong>Failed to load chatbot</strong></div>
            <div style="font-size: 14px; margin-top: 8px;">Please check your connection</div>
            <button class="chatbot-retry-btn" id="chatbot-retry-btn">Retry</button>
          </div>

          <iframe 
            id="chatbot-iframe" 
            src="" 
            style="width: 100%; height: 100%; border: none; border-radius: 16px;"
            allow="microphone; camera"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            loading="lazy">
          </iframe>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", containerHTML);
  }

  function initializeWidget() {
    const elements = {
      container: document.getElementById("chatbot-iframe-container"),
      toggle: document.getElementById("chatbot-iframe-toggle"),
      widget: document.getElementById("chatbot-iframe-widget"),
      iframe: document.getElementById("chatbot-iframe"),
      loadingOverlay: document.getElementById("chatbot-loading-overlay"),
      errorOverlay: document.getElementById("chatbot-error-overlay"),
      retryBtn: document.getElementById("chatbot-retry-btn"),
    };

    let isOpen = false;
    let isLoaded = false;
    let messageCount = 0;
    let retryCount = 0;

    // Load saved state
    if (CHATBOT_CONFIG.behavior.rememberState) {
      const savedState = localStorage.getItem("chatbot-iframe-open");
      if (savedState === "true") {
        toggleChat(true);
      }
    }

    // Build iframe URL with config
    function buildIframeUrl() {
      const params = new URLSearchParams({
        userId: CHATBOT_CONFIG.userId,
        title: CHATBOT_CONFIG.widget.title,
        subtitle: CHATBOT_CONFIG.widget.subtitle,
        welcomeMessage: CHATBOT_CONFIG.widget.welcomeMessage,
        placeholder: CHATBOT_CONFIG.widget.placeholderText,
        primaryColor: CHATBOT_CONFIG.widget.colors.primary,
        secondaryColor: CHATBOT_CONFIG.widget.colors.secondary,
      });

      return `${CHATBOT_CONFIG.iframeUrl}?${params.toString()}`;
    }

    // Event listeners
    elements.toggle.addEventListener("click", () => toggleChat());
    elements.retryBtn.addEventListener("click", () => loadIframe());

    // PostMessage listener
    window.addEventListener("message", handleIframeMessage);

    function toggleChat(forceState = null) {
      isOpen = forceState !== null ? forceState : !isOpen;

      elements.toggle.classList.toggle("active", isOpen);
      elements.widget.classList.toggle("active", isOpen);

      if (isOpen && !isLoaded) {
        loadIframe();
      }

      if (isOpen) {
        removeNotificationBadge();
        messageCount = 0;
      }

      // Save state
      if (CHATBOT_CONFIG.behavior.rememberState) {
        localStorage.setItem("chatbot-iframe-open", isOpen.toString());
      }
    }

    function loadIframe() {
      if (retryCount > 3) {
        showError("Maximum retry attempts reached");
        return;
      }

      showLoading(true);
      showError(false);

      elements.iframe.src = buildIframeUrl();

      // Timeout after 10 seconds
      const timeoutId = setTimeout(() => {
        if (!isLoaded) {
          retryCount++;
          showError("Connection timeout");
        }
      }, 10000);

      elements.iframe.onload = () => {
        clearTimeout(timeoutId);
        isLoaded = true;
        retryCount = 0;
        showLoading(false);
        console.log("✅ Chatbot iframe loaded successfully");
      };

      elements.iframe.onerror = () => {
        clearTimeout(timeoutId);
        retryCount++;
        showError("Failed to load chatbot widget");
      };
    }

    function showLoading(show) {
      elements.loadingOverlay.style.display = show ? "flex" : "none";
    }

    function showError(message) {
      if (message) {
        elements.errorOverlay.style.display = "flex";
        elements.errorOverlay.querySelector(
          "div"
        ).textContent = `⚠️ ${message}`;
      } else {
        elements.errorOverlay.style.display = "none";
      }
    }

    function handleIframeMessage(event) {
      // Security check - only allow messages from our iframe origin
      const allowedOrigin = new URL(CHATBOT_CONFIG.iframeUrl).origin;
      if (event.origin !== allowedOrigin) return;

      const { type, data } = event.data;

      switch (type) {
        case "chatbot-ready":
          isLoaded = true;
          showLoading(false);
          console.log("✅ Chatbot iframe ready");
          break;

        case "chatbot-resize":
          if (data.height) {
            elements.widget.style.height = `${Math.min(data.height, 600)}px`;
          }
          break;

        case "chatbot-close":
          toggleChat(false);
          break;

        case "chatbot-new-message":
          if (!isOpen) {
            messageCount++;
            addNotificationBadge();
          }
          break;

        case "chatbot-error":
          showError(data.message || "An error occurred");
          break;

        default:
          console.log("Unknown message from iframe:", type, data);
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

    // Auto-open behavior
    if (CHATBOT_CONFIG.behavior.autoOpen) {
      setTimeout(() => toggleChat(true), 2000);
    }

    // Public API
    window.ChatbotIframe = {
      open: () => toggleChat(true),
      close: () => toggleChat(false),
      toggle: () => toggleChat(),
      isOpen: () => isOpen,
      isLoaded: () => isLoaded,
      sendMessage: (message) => {
        if (isLoaded && elements.iframe.contentWindow) {
          elements.iframe.contentWindow.postMessage(
            {
              type: "send-message",
              message: message,
            },
            "*"
          );
        }
      },
      reload: () => {
        isLoaded = false;
        retryCount = 0;
        if (isOpen) loadIframe();
      },
    };

    console.log("✅ Chatbot iframe widget initialized!");
  }

  async function init() {
    try {
      if (document.getElementById("chatbot-iframe-container")) {
        console.warn("Chatbot iframe widget already initialized");
        return;
      }

      if (!validateUserConfig()) {
        return;
      }

      injectStyles();
      createWidget();
      initializeWidget();

      console.log(
        `✅ Chatbot iframe initialized for user: ${CHATBOT_CONFIG.userId}`
      );
    } catch (error) {
      console.error("Failed to initialize chatbot iframe widget:", error);
    }
  }

  // Initialize when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
