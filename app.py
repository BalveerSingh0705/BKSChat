from flask import Flask, request, Response, render_template
from werkzeug.utils import secure_filename
from chatbot import ChatService
from chatbot import FileService
import os
import time

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Services
chat_service = ChatService()
file_service = FileService()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    files = []  # Always define files to avoid scope issues
    final_prompt = None

    if request.is_json:
        data = request.get_json()
        prompt = data.get('message', '').strip()
        final_prompt = prompt
    else:
        prompt = request.form.get('message', '').strip()
        files = request.files.getlist('files')
        final_prompt = file_service.extract_text_from_file(prompt, files) if files else prompt

    from_file = bool(files)

    def generate():
        try:
            for chunk in chat_service.generate_response(final_prompt, from_file=from_file):
                for word in chunk.split():
                    time.sleep(0.05)
                    yield word + ' \n'
        except Exception as e:
            yield f"data: [ERROR: {str(e)}]\n\n"

    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, port=5000, static_folder='static', static_url_path='/static')
