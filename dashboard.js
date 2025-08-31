const API_BASE_URL = "https://chatbotku.mooo.com";

// Global state
let modalState = {
  action: null,
  documentId: null,
  filename: null,
  isProcessing: false,
};

let chatState = {
  messages: [],
  isOpen: false,
  isWaitingResponse: false,
};

// DOM Elements
const elements = {
  alert: document.getElementById("alert"),
  uploadArea: document.getElementById("uploadArea"),
  fileInput: document.getElementById("fileInput"),
  uploadButton: document.getElementById("uploadButton"),
  uploadProgress: document.getElementById("uploadProgress"),
  progressFill: document.getElementById("progressFill"),
  documentsContainer: document.getElementById("documentsContainer"),
  confirmModal: document.getElementById("confirmModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalText: document.getElementById("modalText"),
  confirmBtn: document.getElementById("confirmBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  chatOverlay: document.getElementById("chatOverlay"),
  chatMessages: document.getElementById("chatMessages"),
  chatInput: document.getElementById("chatInput"),
  chatSend: document.getElementById("chatSend"),
  chatButton: document.getElementById("chatButton"),
};

// Authentication check
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "login.html";
    return false;
  }

  try {
    const userData = JSON.parse(user);
    document.getElementById("userName").textContent = userData.name || "User";
    document.getElementById("userEmail").textContent = userData.email || "";
    document.getElementById("userAvatar").textContent = (userData.name || "U")
      .charAt(0)
      .toUpperCase();
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  return token;
}

// Show alert function
function showAlert(message, type = "error") {
  elements.alert.textContent = message;
  elements.alert.className = `alert ${type} show`;

  setTimeout(() => {
    elements.alert.classList.remove("show");
  }, 5000);
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token");
  }

  const defaultOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
    throw new Error("Authentication failed");
  }

  return response;
}

// Load user status and stats
async function loadUserStats() {
  try {
    const response = await apiRequest("/my/status");

    if (response.ok) {
      const data = await response.json();

      document.getElementById("aiStatus").textContent = data.personal_ai_status
        ?.ready
        ? "✅ Ready"
        : "⏳ Setup";
      document.getElementById("docCount").textContent =
        data.personal_ai_status?.documents_uploaded || 0;
      document.getElementById("chunkCount").textContent =
        data.personal_ai_status?.total_chunks || 0;
      document.getElementById("storageUsed").textContent =
        (data.personal_ai_status?.vectorstore_size_mb || 0) + " MB";

      // Update chat button based on AI status
      updateChatButtonState(data.personal_ai_status?.ready || false);
    } else {
      console.error("Failed to load stats:", response.status);
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Update chat button state
function updateChatButtonState(isReady) {
  const chatButton = elements.chatButton;
  if (isReady) {
    chatButton.style.opacity = "1";
    chatButton.title = "Chat with AI";
  } else {
    chatButton.style.opacity = "0.5";
    chatButton.title = "Upload documents first to enable chat";
  }
}

// Load user documents
async function loadDocuments() {
  try {
    const response = await apiRequest("/my/documents");

    if (response.ok) {
      const data = await response.json();
      displayDocuments(data.documents || []);
    } else {
      console.error("Failed to load documents:", response.status);
      displayDocuments([]);
    }
  } catch (error) {
    console.error("Error loading documents:", error);
    displayDocuments([]);
  }
}

// Display documents
function displayDocuments(documents) {
  if (!documents || documents.length === 0) {
    elements.documentsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <div class="empty-title">No documents uploaded yet</div>
                <div class="empty-text">Upload your first PDF to start building your knowledge base</div>
            </div>
        `;
    return;
  }

  const documentsGrid = document.createElement("div");
  documentsGrid.className = "documents-grid";

  documents.forEach((doc) => {
    const card = document.createElement("div");
    card.className = "document-card";

    const safeFilename = escapeHtml(doc.filename || "Unknown file");
    const docId = parseInt(doc.id);

    card.innerHTML = `
            <div class="document-header">
                <div>
                    <div class="document-title">${safeFilename}</div>
                    <div class="document-size">${doc.file_size_mb || 0} MB</div>
                </div>
            </div>
            <div class="document-meta">
                📄 ${doc.chunks_created || 0} chunks • 📅 ${formatDate(
      doc.uploaded_at
    )}
            </div>
            <div class="document-actions">
                <button class="btn btn-danger" onclick="confirmDeleteDocument(${docId}, '${escapeQuotes(
      safeFilename
    )}')">
                    🗑️ Delete
                </button>
            </div>
        `;
    documentsGrid.appendChild(card);
  });

  elements.documentsContainer.innerHTML = "";
  elements.documentsContainer.appendChild(documentsGrid);
}

// Helper functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeQuotes(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Invalid date";
  }
}

// File upload setup
function setupFileUpload() {
  elements.fileInput.addEventListener("change", handleFileUpload);

  elements.uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add("dragover");
  });

  elements.uploadArea.addEventListener("dragleave", () => {
    elements.uploadArea.classList.remove("dragover");
  });

  elements.uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    if (files.length > 0) {
      uploadFiles(files);
    }
  });
}

function handleFileUpload(e) {
  const files = Array.from(e.target.files);
  uploadFiles(files);
}

async function uploadFiles(files) {
  if (files.length === 0) return;

  const uploadBtn = elements.uploadButton;
  const textSpan = uploadBtn.querySelector(".text");
  const loadingSpan = uploadBtn.querySelector(".loading");

  uploadBtn.disabled = true;
  textSpan.style.display = "none";
  loadingSpan.style.display = "inline-flex";
  elements.uploadProgress.style.display = "block";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const progress = ((i + 1) / files.length) * 100;
    elements.progressFill.style.width = progress + "%";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiRequest("/my/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(
          data.message || `Successfully uploaded ${file.name}`,
          "success"
        );
      } else {
        showAlert(data.detail || `Failed to upload ${file.name}`, "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showAlert(`Error uploading ${file.name}`, "error");
    }
  }

  uploadBtn.disabled = false;
  textSpan.style.display = "inline";
  loadingSpan.style.display = "none";
  elements.uploadProgress.style.display = "none";
  elements.progressFill.style.width = "0%";
  elements.fileInput.value = "";

  await Promise.all([loadUserStats(), loadDocuments()]);
}

// Chat Functions
function openChat() {
  // Check if AI is ready
  const aiStatusElement = document.getElementById("aiStatus");
  const isReady = aiStatusElement.textContent.includes("✅");

  if (!isReady) {
    showAlert(
      "Please upload at least one PDF document to enable chat functionality",
      "error"
    );
    return;
  }

  chatState.isOpen = true;
  elements.chatOverlay.classList.add("show");
  elements.chatInput.focus();

  // Initialize chat if no messages
  if (chatState.messages.length === 0) {
    addSystemMessage("Welcome! Ask me anything about your uploaded documents.");
  }
}

function closeChat() {
  chatState.isOpen = false;
  elements.chatOverlay.classList.remove("show");
}

function addMessage(content, type, timestamp = null) {
  const message = {
    content,
    type,
    timestamp: timestamp || new Date().toISOString(),
  };

  chatState.messages.push(message);
  renderMessage(message);
  scrollToBottom();
}

function addSystemMessage(content) {
  addMessage(content, "system");
}

function renderMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${message.type}`;

  const content = document.createElement("div");
  content.textContent = message.content;
  messageDiv.appendChild(content);

  if (message.type !== "system") {
    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = formatMessageTime(message.timestamp);
    messageDiv.appendChild(timeDiv);
  }

  // Remove empty state if exists
  const emptyState = elements.chatMessages.querySelector(".chat-empty");
  if (emptyState) {
    emptyState.remove();
  }

  elements.chatMessages.appendChild(messageDiv);
}

// Widget Modal Functions - Add these to your existing dashboard.js

// Get current user ID (you'll need to implement this based on your auth system)
function getCurrentUserId() {
  // Replace with your actual user ID retrieval logic
  return (
    localStorage.getItem("userId") || "54852c8d-0510-42b4-bde9-19f842bf7159"
  );
}

// Get base URL for your chatbot service
function getChatbotBaseUrl() {
  // Replace with your actual chatbot service URL
  return "http://localhost:3001";
}

// Open widget modal
function openWidgetModal() {
  const modal = document.getElementById("widgetModal");
  modal.classList.add("show");
  updateAllCodes();
}

// Close widget modal
function closeWidgetModal() {
  const modal = document.getElementById("widgetModal");
  modal.classList.remove("show");
}

// Update live preview
function updatePreview() {
  const title = document.getElementById("widgetTitle").value;
  const subtitle = document.getElementById("widgetSubtitle").value;
  const logoUrl = document.getElementById("widgetLogoUrl").value;
  const position = document.getElementById("widgetPosition").value;
  const width = document.getElementById("widgetWidth").value;
  const height = document.getElementById("widgetHeight").value;
  const showClose = document.getElementById("widgetShowClose").checked;

  // Update preview elements
  document.getElementById("previewTitle").textContent = title;
  document.getElementById("previewSubtitle").textContent = subtitle;
  document.getElementById("previewLogo").src = logoUrl;
  document.getElementById("previewClose").style.display = showClose
    ? "block"
    : "none";

  // Update preview frame position and size
  const previewFrame = document.getElementById("previewFrame");
  const frameWidth = Math.min(parseInt(width) * 0.75, 300); // Scale down for preview
  const frameHeight = Math.min(parseInt(height) * 0.2, 120); // Scale down for preview

  previewFrame.style.width = frameWidth + "px";
  previewFrame.style.height = frameHeight + "px";

  // Position the preview frame based on selection
  previewFrame.style.bottom = position.includes("bottom") ? "20px" : "auto";
  previewFrame.style.top = position.includes("top") ? "20px" : "auto";
  previewFrame.style.right = position.includes("right") ? "20px" : "auto";
  previewFrame.style.left = position.includes("left") ? "20px" : "auto";

  // Update all code sections
  updateAllCodes();
}

// Generate widget configuration object
function getWidgetConfig() {
  return {
    userId: getCurrentUserId(),
    title: document.getElementById("widgetTitle").value,
    subtitle: document.getElementById("widgetSubtitle").value,
    width: document.getElementById("widgetWidth").value,
    height: document.getElementById("widgetHeight").value,
    position: document.getElementById("widgetPosition").value,
    logoUrl: document.getElementById("widgetLogoUrl").value,
    showClose: document.getElementById("widgetShowClose").checked,
    baseUrl: getChatbotBaseUrl(),
  };
}

// Generate HTML/React iframe code
function generateHtmlCode(config) {
  const positionStyles = {
    "bottom-right": `bottom: "20px", right: "20px"`,
    "bottom-left": `bottom: "20px", left: "20px"`,
    "top-right": `top: "20px", right: "20px"`,
    "top-left": `top: "20px", left: "20px"`,
  };

  const queryParams = new URLSearchParams({
    userId: config.userId,
    title: config.title,
    subtitle: config.subtitle,
    showClose: config.showClose,
    logoUrl: config.logoUrl,
  }).toString();

  return `<iframe
  id="chatbot-iframe"
  src="${config.baseUrl}/chatbot-widget-iframe.html?${queryParams}"
  style={{
    position: "fixed",
    ${positionStyles[config.position]},
    width: "${config.width}px",
    height: "${config.height}px",
    border: "none",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    zIndex: 999999,
  }}
></iframe>`;
}

// Generate script tag code
function generateScriptCode(config) {
  return `<script src="${config.baseUrl}/chatbot-helper.js"></script>`;
}

// Generate Next.js layout example
function generateNextjsCode(config) {
  const positionStyles = {
    "bottom-right": 'bottom: "20px",\n              right: "20px",',
    "bottom-left": 'bottom: "20px",\n              left: "20px",',
    "top-right": 'top: "20px",\n              right: "20px",',
    "top-left": 'top: "20px",\n              left: "20px",',
  };

  const queryParams = new URLSearchParams({
    userId: config.userId,
    title: config.title,
    subtitle: config.subtitle,
    showClose: config.showClose,
    logoUrl: config.logoUrl,
  }).toString();

  return `// Add this to your layout.tsx or _app.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        
        {/* Chatbot Widget */}
        <iframe
          id="chatbot-iframe"
          src="${config.baseUrl}/chatbot-widget-iframe.html?${queryParams}"
          style={{
            position: "fixed",
            ${positionStyles[config.position]}
            width: "${config.width}px",
            height: "${config.height}px",
            border: "none",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 999999,
          }}
        />
        
        <script src="${config.baseUrl}/chatbot-helper.js"></script>
      </body>
    </html>
  );
}`;
}

// Update all code sections
function updateAllCodes() {
  const config = getWidgetConfig();

  document.getElementById("htmlCode").value = generateHtmlCode(config);
  document.getElementById("scriptCode").value = generateScriptCode(config);
  document.getElementById("nextjsCode").value = generateNextjsCode(config);
}

// Copy code to clipboard
async function copyCode(codeId) {
  const codeElement = document.getElementById(codeId);
  const code = codeElement.value;

  try {
    await navigator.clipboard.writeText(code);
    showCopyToast();
  } catch (err) {
    // Fallback for older browsers
    codeElement.select();
    codeElement.setSelectionRange(0, 99999);
    document.execCommand("copy");
    showCopyToast();
  }
}

// Show copy success toast
function showCopyToast() {
  const toast = document.getElementById("copyToast");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const widgetModal = document.getElementById("widgetModal");
  if (event.target === widgetModal) {
    closeWidgetModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const widgetModal = document.getElementById("widgetModal");
    if (widgetModal.classList.contains("show")) {
      closeWidgetModal();
    }
  }
});

// Initialize widget modal when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Set initial values and update codes
  updateAllCodes();
});

function formatMessageTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function scrollToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";
  typingDiv.id = "typingIndicator";

  typingDiv.innerHTML = `
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
        <span>AI is typing...</span>
    `;

  elements.chatMessages.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

async function sendMessage() {
  const input = elements.chatInput;
  const message = input.value.trim();

  if (!message || chatState.isWaitingResponse) return;

  // Add user message
  addMessage(message, "user");
  input.value = "";

  // Update UI for sending
  chatState.isWaitingResponse = true;
  const sendBtn = elements.chatSend;
  const textSpan = sendBtn.querySelector(".text");
  const loadingSpan = sendBtn.querySelector(".loading");

  sendBtn.disabled = true;
  textSpan.style.display = "none";
  loadingSpan.style.display = "inline-flex";

  showTypingIndicator();

  try {
    const formData = new URLSearchParams();
    formData.append("question", message);

    const response = await apiRequest("/my/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData.toString(),
    });

    const data = await response.json();

    hideTypingIndicator();

    if (response.ok) {
      addMessage(
        data.answer || "I apologize, but I could not generate a response.",
        "assistant"
      );
    } else {
      addMessage(
        `Error: ${data.detail || "Failed to get response from AI"}`,
        "system"
      );
    }
  } catch (error) {
    hideTypingIndicator();
    console.error("Chat error:", error);
    addMessage(
      "Sorry, there was an error processing your message. Please try again.",
      "system"
    );
  } finally {
    // Reset UI
    chatState.isWaitingResponse = false;
    sendBtn.disabled = false;
    textSpan.style.display = "inline";
    loadingSpan.style.display = "none";
    input.focus();
  }
}

// Setup chat event listeners
function setupChatListeners() {
  elements.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  elements.chatInput.addEventListener("input", () => {
    // Auto-resize textarea
    elements.chatInput.style.height = "auto";
    elements.chatInput.style.height = elements.chatInput.scrollHeight + "px";
  });
}

// Modal functions
function showModal(title, text, action, docId = null, filename = null) {
  modalState = {
    action,
    documentId: docId,
    filename,
    isProcessing: false,
  };

  elements.modalTitle.textContent = title;
  elements.modalText.textContent = text;
  elements.confirmModal.classList.add("show");

  const confirmBtn = elements.confirmBtn;
  const btnText = confirmBtn.querySelector(".btn-text");
  const btnLoading = confirmBtn.querySelector(".loading");

  confirmBtn.disabled = false;
  btnText.style.display = "inline";
  btnLoading.style.display = "none";
}

function closeModal() {
  if (modalState.isProcessing) {
    return;
  }

  elements.confirmModal.classList.remove("show");
  modalState = {
    action: null,
    documentId: null,
    filename: null,
    isProcessing: false,
  };
}

function confirmDeleteDocument(docId, filename) {
  if (!docId || isNaN(docId)) {
    showAlert("Invalid document ID", "error");
    return;
  }

  showModal(
    "Delete Document",
    `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
    "deleteDocument",
    docId,
    filename
  );
}

function confirmClearAll() {
  showModal(
    "Clear All Documents",
    "Are you sure you want to delete ALL documents? This will completely reset your AI assistant and cannot be undone.",
    "clearAll"
  );
}

async function executeModalAction() {
  if (modalState.isProcessing || !modalState.action) {
    return;
  }

  modalState.isProcessing = true;

  const confirmBtn = elements.confirmBtn;
  const btnText = confirmBtn.querySelector(".btn-text");
  const btnLoading = confirmBtn.querySelector(".loading");

  confirmBtn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";

  try {
    if (modalState.action === "deleteDocument") {
      await deleteDocument(modalState.documentId);
    } else if (modalState.action === "clearAll") {
      await clearAllDocuments();
    }
  } finally {
    confirmBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
    modalState.isProcessing = false;
    closeModal();
  }
}

async function deleteDocument(docId) {
  if (!docId || isNaN(docId)) {
    showAlert("Invalid document ID", "error");
    return;
  }

  try {
    const response = await apiRequest(`/my/documents/${docId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      showAlert(data.message || "Document deleted successfully", "success");
      await Promise.all([loadUserStats(), loadDocuments()]);
    } else {
      showAlert(data.detail || "Failed to delete document", "error");
    }
  } catch (error) {
    console.error("Delete error:", error);
    showAlert("Error deleting document", "error");
  }
}

async function clearAllDocuments() {
  try {
    const response = await apiRequest("/my/clear-all", {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      showAlert(
        data.message || "All documents cleared successfully",
        "success"
      );
      // Reset chat state when documents are cleared
      chatState.messages = [];
      if (chatState.isOpen) {
        elements.chatMessages.innerHTML = `
                    <div class="chat-empty">
                        <div class="chat-empty-icon">💬</div>
                        <div class="chat-empty-title">No documents available</div>
                        <div class="chat-empty-text">Upload documents to start chatting</div>
                    </div>
                `;
      }
      await Promise.all([loadUserStats(), loadDocuments()]);
    } else {
      showAlert(data.detail || "Failed to clear documents", "error");
    }
  } catch (error) {
    console.error("Clear error:", error);
    showAlert("Error clearing documents", "error");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// Setup event listeners
function setupEventListeners() {
  elements.confirmBtn.addEventListener("click", executeModalAction);

  // Close modals on outside click
  elements.confirmModal.addEventListener("click", (e) => {
    if (e.target === elements.confirmModal && !modalState.isProcessing) {
      closeModal();
    }
  });

  elements.chatOverlay.addEventListener("click", (e) => {
    if (e.target === elements.chatOverlay) {
      closeChat();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (chatState.isOpen && !chatState.isWaitingResponse) {
        closeChat();
      } else if (!modalState.isProcessing) {
        closeModal();
      }
    }
  });
}

// Initialize dashboard
window.addEventListener("load", async () => {
  if (checkAuth()) {
    try {
      setupFileUpload();
      setupChatListeners();
      setupEventListeners();
      await Promise.all([loadUserStats(), loadDocuments()]);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      showAlert("Error loading dashboard data", "error");
    }
  }
});
