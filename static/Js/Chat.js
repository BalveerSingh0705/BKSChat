class ChatApp {
  constructor() {
    this.chatHistory = [];
    // Database.initDB(this);
    UI.initUI(this);
    this.attachments = [];
    this.currentChatId = Date.now().toString();
    this.chatContainer = document.getElementById('chat-container');
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');

    this.attachBtn = document.getElementById('attach-btn');
    this.fileInput = document.getElementById('file-input');
    this.attachmentPreview = document.getElementById('attachment-preview');
    this.newChatBtn = document.getElementById('new-chat-btn');
    this.chatHistory = document.getElementById('chat-history');
    this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
    this.sidebar = document.getElementById('sidebar');

    this.initApp();
  }
  async initApp() {
    await Database.initDB(this); // Wait for the database to initialize
    UI.initUI(this); // Initialize the UI
    this.initEventListeners();
    this.startNewChat();
  }

  initEventListeners() {
    this.userInput.addEventListener('input', () => this.autoResizeInput());
    this.userInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.attachBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
    this.newChatBtn.addEventListener('click', () => this.startNewChat());
    this.mobileMenuBtn.addEventListener('click', () => this.sidebar.classList.toggle('active'));
  }

  autoResizeInput() {
    this.userInput.style.height = 'auto';
    this.userInput.style.height = `${this.userInput.scrollHeight}px`;
    this.sendBtn.disabled = this.userInput.value.trim() === '' && this.attachments.length === 0;
  }

  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }
  resetSendButton() {
    this.sendBtn.disabled = false;
    this.sendBtn.innerHTML = `<i class="fas fa-paper-plane"></i>`;
    this.sendBtn.classList.add('enabled');
  }

  handleFileSelection(e) {
    for (let file of e.target.files) {
      this.addAttachment(file);
    }
    this.fileInput.value = '';
    this.sendBtn.disabled = this.userInput.value.trim() === '' && this.attachments.length === 0;
  }

  sendMessage() {
    const message = this.userInput.value.trim();
    if (message === '' && this.attachments.length === 0) return;
    
    // this.sendBtn.disabled = true;
    
    // this.sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    // this.sendBtn.classList.remove('enabled');

    this.addMessage(message, 'user', this.attachments);
  
    let requestBody;
    let headers = {};
  
    if (this.attachments.length > 0) {
      // Use FormData if there are attachments
      requestBody = new FormData();
      requestBody.append('message', message);
      this.attachments.forEach((file) => requestBody.append('files', file));
      // ✅ Do NOT set Content-Type manually when using FormData
    } else {
      // Use JSON if there are no attachments
      requestBody = JSON.stringify({ message });
      headers['Content-Type'] = 'application/json'; // ✅ Set only for JSON
    }
  
    this.userInput.value = '';
    this.userInput.style.height = 'auto';
    this.attachments = [];
    this.updateAttachmentPreview();
    this.sendBtn.disabled = true;
    this.showTypingIndicator();
  
    fetch('/chat', {
      method: 'POST',
      body: requestBody,
      headers,
    })
      .then((response) => {
        if (!response.body) throw new Error('No stream received');
        const messageDiv = this.createStreamingMessage();
        return this.streamAIResponse(response, messageDiv);
      })
      .catch((err) => {
        this.removeTypingIndicator();
        this.addMessage(`Error: ${err.message}`, 'ai');
        this.resetSendButton();
      });
  }
    async streamAIResponse(response, messageElement) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let botResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Remove the typing indicator once the response is fully received
        this.removeTypingIndicator();
        this.sendBtn.disabled = false;
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      botResponse += chunk;
      // Prepare_responce= this.addMessage(botResponse, 'ai', []);
      messageElement.innerHTML = formatResponseText(botResponse)
       // Add the chunk to the chat container
      // Update the message element with the streamed response
     // messageElement.innerHTML = formatResponseText(botResponse);
      this.scrollToBottom();
    }
  }

  createStreamingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  addMessage(text, sender, files = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
  
    const fileHTML = files.length > 0 ? this.createAttachmentHTML(files) : '';
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas ${sender === 'ai' ? 'fa-robot' : 'fa-user'}"></i>
      </div>
      <div class="message-content">
        <div class="message-text">${formatResponseText(text)}</div>
        ${fileHTML}
      </div>
    `;
  
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }
  

  createAttachmentHTML(files) {
    return `
      <div class="attachments">
        ${files.map(file => `<div class="attachment">${file.name}</div>`).join('')}
      </div>
    `;
  }

  addAttachment(file) {
    this.attachments.push(file);
    this.updateAttachmentPreview();
    this.sendBtn.disabled = this.userInput.value.trim() === '' && this.attachments.length === 0;
  }

  updateAttachmentPreview() {
    this.attachmentPreview.innerHTML = '';
    this.attachments.forEach((file, index) => {
      const attachmentDiv = document.createElement('div');
      attachmentDiv.className = 'attachment-item';
      attachmentDiv.innerHTML = `
        <span>${file.name}</span>
        <button class="attachment-remove" data-index="${index}">&times;</button>
      `;
      this.attachmentPreview.appendChild(attachmentDiv);
    });

    this.attachmentPreview.querySelectorAll('.attachment-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        this.attachments.splice(index, 1);
        this.updateAttachmentPreview();
        this.sendBtn.disabled = this.userInput.value.trim() === '' && this.attachments.length === 0;
       
      });
    });
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `<em>Assistant is typing...</em>`;
    this.chatContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
  }

  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  startNewChat() {
    this.chatContainer.innerHTML = '';
    //this.addMessage("Hello! I'm your AI assistant. How can I help you today?", 'ai');
    this.attachments = [];
    this.updateAttachmentPreview();
    this.userInput.value = '';
    this.userInput.style.height = 'auto';
    this.sendBtn.disabled = true;
  }
}


// Export the ChatApp class for use in other files
// export default ChatApp;
function formatResponseText(text) {
  if (!text) return '';

  // Enhance code blocks with syntax highlighting
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const codeId = `code-${Math.random().toString(36).substr(2, 8)}`;
    return `
      <div class="relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-900 my-4">
        <button onclick="navigator.clipboard.writeText(document.getElementById('${codeId}').innerText)"
          class="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition">
          Copy
        </button>
        <pre class="text-sm overflow-x-auto p-4"><code id="${codeId}" class="language-${lang || 'text'} text-white">${escapeHtml(code.trim())}</code></pre>
      </div>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, 
    '<br><code class="language-java" style="background-color: red;">$1</code>');
  

  // Headings
  text = text
    .replace(/^### (.+)$/gm, '<h4 class="text-md font-bold mt-4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-lg font-bold mt-4">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold mt-6">$1</h2>');

  // Bold & Italic
  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<br><strong class="font-bold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/__([^_]+)__/g, '<strong class="font-bold">$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/[;{}}]/g, '<a>$&</a><br>');



  // Lists
  text = text.replace(/(^|\n)[*\-+] (.+)/g, '$1<li class="list-disc ml-6 mb-1">$2</li>');

  // Paragraphs
  text = text.split(/\n{2,}/).map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<') && !p.startsWith('<p')) return p;
    return `<p class="mb-3 text-gray-800 dark:text-gray-200">${p}</p>`;
  }).join('');

  return `<div class="formatted-content space-y-4 text-sm leading-relaxed">${text}</div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}