class Database {
  /**
   * Initializes the database and creates the required table if it doesn't exist.
   * @param {Object} chatApp - The main ChatApp instance.
   */
  static initDB(chatApp) {
    try {
      // Check if SQL.js is loaded
      if (!window.SQL) {
        console.warn("SQL.js not loaded");
        return;
      }

      // Initialize the database
      chatApp.db = new SQL.Database();

      // Create the `chats` table if it doesn't exist
      chatApp.db.run(`
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY,
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
   * Loads chat history from the database and displays it in the chatbox.
   * @param {Object} chatApp - The main ChatApp instance.
   */
  static loadChatHistory(chatApp) {
    try {
      if (!chatApp.db) return;

      // Prepare a query to fetch all chats ordered by timestamp
      const stmt = chatApp.db.prepare("SELECT * FROM chats ORDER BY timestamp ASC");

      // Iterate through the results and push them to the chat history
      while (stmt.step()) {
        const row = stmt.getAsObject();
        chatApp.chatHistory.push(row);

        // Display the message in the chatbox using MessageHandler
        MessageHandler.displayMessage(chatApp, row.role, row.content);
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
  }

  /**
   * Saves a new message to the database.
   * @param {Object} chatApp - The main ChatApp instance.
   * @param {string} role - The role of the message sender (e.g., 'user' or 'bot').
   * @param {string} content - The content of the message.
   */
  static saveMessage(chatApp, role, content) {
    try {
      if (!chatApp.db) return;

      // Prepare an INSERT statement
      const stmt = chatApp.db.prepare("INSERT INTO chats (role, content) VALUES (?, ?)");

      // Bind the role and content to the statement
      stmt.bind([role, content]);

      // Execute the statement
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

      // Run a DELETE query to clear the table
      chatApp.db.run("DELETE FROM chats");

      // Clear the in-memory chat history
      chatApp.chatHistory = [];
    } catch (e) {
      console.error("Error clearing chat history:", e);
    }
  }
}