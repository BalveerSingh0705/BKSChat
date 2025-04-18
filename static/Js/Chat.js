class ChatApp {
  constructor() {
    this.chatHistory = [];
    this.isProcessing = false;
  }

  sendMessage() {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const message = userInput.value.trim();

    if (message && !this.isProcessing) {
      sendBtn.disabled = true;
      // Save and display the user's message
      Database.saveMessage(this, 'user', message);
      MessageHandler.displayMessage(this, 'user', message);

      // Clear the input field
      userInput.value = '';

      // Start processing the bot's response
      this.isProcessing = true;
      this.fetchResponse(message);
    }
  }

  async fetchResponse(message) {
    const chatbox = document.getElementById('chatbox');
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'message bot-message';
    botMessageDiv.innerHTML = '<span class="loading-dots">...</span>';
    chatbox.appendChild(botMessageDiv);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from the server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        botResponse += chunk;

        // Format the response text
        botMessageDiv.innerHTML = formatResponseText(botResponse);

        chatbox.scrollTop = chatbox.scrollHeight;
      }

      // Save the bot's response to the database
      Database.saveMessage(this, 'bot', botResponse);
      this.isProcessing = false;
    } catch (error) {
      console.error('Error fetching response:', error);
      botMessageDiv.innerHTML = '<span class="error">Error receiving response</span>';
      this.isProcessing = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    window.chatApp = new ChatApp();
    const sendBtn = document.getElementById('send-btn');
    sendBtn.addEventListener('click', () => chatApp.sendMessage());

    const userInput = document.getElementById('user-input');
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatApp.sendMessage();
      }
    });
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

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
