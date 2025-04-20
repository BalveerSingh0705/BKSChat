

document.addEventListener('DOMContentLoaded', () => {
  try {
    // window.chatApp = new ChatApp();
  } catch (error) {
    console.error('Initialization error:', error);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      background-color: red;
      color: white;
      z-index: 1000;
    `;
    errorDiv.textContent = 'Failed to initialize chat application. Please check console for details.';
    document.body.appendChild(errorDiv);
  }
});

class UI {
  /**
   * Initializes UI elements and event listeners.
   * @param {Object} chatApp - The main ChatApp instance.
   */
  static initUI(chatApp) {
    try {
      chatApp.chatContainer = document.getElementById('chat-container');
      chatApp.userInput = document.getElementById('user-input');
      chatApp.sendBtn = document.getElementById('send-btn');
      chatApp.fileInput = document.getElementById('file-input');
      chatApp.attachBtn = document.getElementById('attach-btn');
      chatApp.chatHistoryContainer = document.getElementById('chat-history');

      // Initialize event listeners
      UI.initEventListeners(chatApp);
    } catch (e) {
      console.error("Failed to initialize UI elements:", e);
    }
  }

  /**
   * Initializes event listeners for UI elements.
   * @param {Object} chatApp - The main ChatApp instance.
   */
  static initEventListeners(chatApp) {
    try {
      chatApp.sendBtn.addEventListener('click', () => chatApp.sendMessage());

      chatApp.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          chatApp.sendMessage();
        }
      });
    } catch (e) {
      console.error("Failed to initialize event listeners:", e);
    }
  }

  /**
   * Displays a message in the chat container.
   * @param {Object} chatApp - The main ChatApp instance.
   * @param {string} role - The role of the message sender (e.g., 'user' or 'ai').
   * @param {string} content - The content of the message.
   */
  static displayMessage(chatApp, role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas ${role === 'ai' ? 'fa-robot' : 'fa-user'}"></i>
      </div>
      <div class="message-content">
        <div class="message-text">${content}</div>
      </div>
    `;
    chatApp.chatContainer.appendChild(messageDiv);
    chatApp.chatContainer.scrollTop = chatApp.chatContainer.scrollHeight;
  }

  /**
   * Adds a chat message to the chat history in the sidebar.
   * @param {Object} chatApp - The main ChatApp instance.
   * @param {string} content - The content of the message.
   */
  static addChatToHistory(chatApp, content) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.textContent = content.length > 30 ? `${content.substring(0, 30)}...` : content;

    chatItem.addEventListener('click', () => {
      alert('Load chat functionality can be implemented here.');
    });

    chatApp.chatHistoryContainer.appendChild(chatItem);
  }
}



