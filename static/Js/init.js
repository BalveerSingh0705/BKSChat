

document.addEventListener('DOMContentLoaded', () => {
  try {
    window.chatApp = new ChatApp();
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Failed to initialize chat application.');
  }
});