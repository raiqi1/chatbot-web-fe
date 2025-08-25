(function () {
  "use strict";

  // Prevent multiple initialization
  if (window.chatbotHelperLoaded) {
    console.warn("⚠️ Chatbot helper already loaded");
    return;
  }
  window.chatbotHelperLoaded = true;

  console.log("🚀 Loading Chatbot Helper...");

  // Find the chatbot iframe
  let chatbotIframe = document.getElementById("chatbot-iframe");
  if (!chatbotIframe) {
    chatbotIframe = document.querySelector('iframe[src*="chatbot-widget"]');
  }

  if (!chatbotIframe) {
    console.error(
      '❌ Chatbot iframe not found! Make sure iframe has id="chatbot-iframe" or src contains "chatbot-widget"'
    );
    return;
  }

  // Create floating button
  const floatingButton = document.createElement("button");
  floatingButton.id = "chatbot-floating-btn";
  floatingButton.innerHTML = "💬";
  floatingButton.style.cssText = `
        display: none;
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 999998;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: all 0.3s ease;
        font-family: system-ui, -apple-system, sans-serif;
    `;

  // Add floating button to page
  document.body.appendChild(floatingButton);

  // Add pulse animation
  const style = document.createElement("style");
  style.textContent = `
        @keyframes chatbot-pulse {
            0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
            100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
        }
        #chatbot-floating-btn {
            animation: chatbot-pulse 2s infinite;
        }
        #chatbot-floating-btn:hover {
            transform: scale(1.1);
            animation: none;
        }
    `;
  document.head.appendChild(style);

  // Handle messages from iframe
  window.addEventListener("message", function (event) {
    // Basic security check
    if (
      !event.origin.includes("localhost") &&
      !event.origin.includes("chatbot")
    ) {
      return;
    }

    const { type, userId } = event.data;

    switch (type) {
      case "chatbot-hide-iframe":
      case "chatbot-minimized":
        console.log("📱 Hiding chatbot iframe");
        chatbotIframe.style.display = "none";
        floatingButton.style.display = "flex";

        // Trigger custom event for client
        window.dispatchEvent(
          new CustomEvent("chatbotMinimized", {
            detail: { userId },
          })
        );
        break;

      case "chatbot-show-iframe":
      case "chatbot-expanded":
        console.log("📱 Showing chatbot iframe");
        chatbotIframe.style.display = "block";
        floatingButton.style.display = "none";

        // Trigger custom event for client
        window.dispatchEvent(
          new CustomEvent("chatbotExpanded", {
            detail: { userId },
          })
        );
        break;

      case "chatbot-ready":
        console.log("✅ Chatbot ready for user:", userId);

        // Trigger custom event for client
        window.dispatchEvent(
          new CustomEvent("chatbotReady", {
            detail: { userId },
          })
        );
        break;

      case "chatbot-new-message":
        console.log("💬 New message:", event.data.userMessage);

        // Trigger custom event for client (for analytics, notifications, etc.)
        window.dispatchEvent(
          new CustomEvent("chatbotNewMessage", {
            detail: {
              userId,
              userMessage: event.data.userMessage,
              botResponse: event.data.botResponse,
            },
          })
        );
        break;

      case "chatbot-error":
        console.error("❌ Chatbot error:", event.data.message);

        // Trigger custom event for client
        window.dispatchEvent(
          new CustomEvent("chatbotError", {
            detail: {
              userId,
              error: event.data.message,
            },
          })
        );
        break;

      default:
        // Handle other message types if needed
        break;
    }
  });

  // Handle floating button click
  floatingButton.addEventListener("click", function () {
    console.log("🔄 Floating button clicked - showing chatbot");

    chatbotIframe.style.display = "block";
    floatingButton.style.display = "none";

    // Send message to iframe to show widget
    chatbotIframe.contentWindow.postMessage(
      {
        type: "show-widget",
      },
      "*"
    );
  });

  // Expose API for client to control chatbot
  window.chatbotAPI = {
    show: function () {
      chatbotIframe.style.display = "block";
      floatingButton.style.display = "none";
      chatbotIframe.contentWindow.postMessage({ type: "show-widget" }, "*");
    },

    hide: function () {
      chatbotIframe.contentWindow.postMessage({ type: "minimize-widget" }, "*");
    },

    sendMessage: function (message) {
      chatbotIframe.contentWindow.postMessage(
        {
          type: "send-message",
          message: message,
        },
        "*"
      );
    },

    focusInput: function () {
      chatbotIframe.contentWindow.postMessage({ type: "focus-input" }, "*");
    },
  };

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      floatingButton.style.animation = "none";
    } else {
      floatingButton.style.animation = "chatbot-pulse 2s infinite";
    }
  });

  // Mobile responsive adjustments
  function updateMobileStyles() {
    if (window.innerWidth <= 768) {
      floatingButton.style.width = "50px";
      floatingButton.style.height = "50px";
      floatingButton.style.fontSize = "20px";
      floatingButton.style.bottom = "15px";
      floatingButton.style.right = "15px";

      chatbotIframe.style.bottom = "15px";
      chatbotIframe.style.right = "15px";
    } else {
      floatingButton.style.width = "60px";
      floatingButton.style.height = "60px";
      floatingButton.style.fontSize = "24px";
      floatingButton.style.bottom = "20px";
      floatingButton.style.right = "20px";

      chatbotIframe.style.bottom = "20px";
      chatbotIframe.style.right = "20px";
    }
  }

  // Update on load and resize
  updateMobileStyles();
  window.addEventListener("resize", updateMobileStyles);

  console.log("✅ Chatbot Helper loaded successfully!");
  console.log(
    "📖 Available API: window.chatbotAPI.show(), .hide(), .sendMessage(), .focusInput()"
  );
  console.log(
    "📖 Available Events: chatbotReady, chatbotMinimized, chatbotExpanded, chatbotNewMessage, chatbotError"
  );
})();
