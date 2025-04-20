class Database {
  /**
   * Initializes the database and creates the required table if it doesn't exist.
   * @param {Object} chatApp - The main ChatApp instance.
   */
  static async initDB(chatApp) {
    try {
      if (!window.SQL) {
        console.warn("SQL.js not loaded");
        return;
      }

      // Wait for SQL.js to initialize
      const SQL = await window.initSqlJs({
        locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`,
      });

      // Initialize the database
      chatApp.db = new SQL.Database();

      // Create the `chats` table if it doesn't exist
      chatApp.db.run(`
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role TEXT,
          content TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Load existing chat history
      Database.loadChatHistory(chatApp);
    } catch (e) {
      console.error("Failed to initialize database:", e);
    }
  }

  /**
   * Loads chat history from the database and displays it in the chatbox and sidebar.
   * @param {Object} chatApp - The main ChatApp instance.
   */
  static loadChatHistory(chatApp) {
    try {
      if (!chatApp.db) return;

      const stmt = chatApp.db.prepare("SELECT * FROM chats ORDER BY timestamp ASC");

      while (stmt.step()) {
        const row = stmt.getAsObject();
        chatApp.chatHistory.push(row);

        // Display the message in the chatbox
        UI.displayMessage(chatApp, row.role, row.content);

        // Add the message to the chat history in the sidebar
        UI.addChatToHistory(chatApp, row.content);
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
  }

  /**
   * Saves a new message to the database.
   * @param {Object} chatApp - The main ChatApp instance.
   * @param {string} role - The role of the message sender (e.g., 'user' or 'ai').
   * @param {string} content - The content of the message.
   */
  static saveMessage(chatApp, role, content) {
    try {
      if (!chatApp.db) return;

      const stmt = chatApp.db.prepare("INSERT INTO chats (role, content) VALUES (?, ?)");
      stmt.bind([role, content]);
      stmt.step();
    } catch (e) {
      console.error("Error saving message:", e);
    }
  }

  /**
   * Clears all chat history from the database.
   * @param {Object} chatApp - The main ChatApp instance.
   */
  static clearChatHistory(chatApp) {
    try {
      if (!chatApp.db) return;

      chatApp.db.run("DELETE FROM chats");
      chatApp.chatHistory = [];
    } catch (e) {
      console.error("Error clearing chat history:", e);
    }
  }
}


