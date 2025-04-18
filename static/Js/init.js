document.addEventListener('DOMContentLoaded', () => {
  try {
    if (!window.markdownit || !window.feather || !window.Prism) {
      throw new Error("Required libraries not loaded");
    }
    window.chatApp = new ChatApp();
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