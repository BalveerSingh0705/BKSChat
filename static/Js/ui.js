class UI {
  static initUIElements(chatApp) {
    try {
      feather.replace();
      chatApp.chatbox = document.getElementById('chatbox');
      chatApp.userInput = document.getElementById('user-input');
      chatApp.sendBtn = document.getElementById('send-btn');
      chatApp.fileUpload = document.getElementById('file-upload');
      chatApp.docBtn = document.getElementById('doc-btn');
      chatApp.themeToggle = document.getElementById('theme-toggle');
      chatApp.tokenCount = document.getElementById('token-count');
      chatApp.currentTime = document.getElementById('current-time');
    } catch (e) {
      console.error("Failed to initialize UI elements:", e);
    }
  }

  static initEventListeners(chatApp) {
    try {
      if (chatApp.sendBtn) {
        chatApp.sendBtn.addEventListener('click', () => chatApp.sendMessage());
      }

      if (chatApp.userInput) {
        chatApp.userInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatApp.sendMessage();
          }
        });
      }
    } catch (e) {
      console.error("Failed to initialize event listeners:", e);
    }
  }
}