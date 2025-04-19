from flask import Flask, request, jsonify, Response, render_template
from werkzeug.utils import secure_filename
from chatbot import ChatService  
import os
import time

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
class FileService:
    def extract_text_from_file(self, filepath):
        """Simulate file text extraction"""
        # In a real implementation, you would use libraries like PyPDF2, python-docx, etc.
        return f"Sample extracted text from {os.path.basename(filepath)}:\n\nThis would contain the actual file content in a real implementation."

# Initialize services
chat_service = ChatService()
file_service = FileService()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    prompt = data.get('message', '').strip()
    print(f"Received prompt: {prompt}")
    if not prompt:
        return jsonify({'error': 'Empty message'}), 400

    def generate():
        try:
            for chunk in chat_service.generate_response(prompt):
                words = chunk.split()  # Split chunk into words
                for word in words:
                    time.sleep(0.05)  # Simulate delay for streaming
                    yield word +' '
                    yield '\n'  # Newline after each word for better readability
        except Exception as e:
            yield f"data: [ERROR: {str(e)}]\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        if file.filename.lower().split('.')[-1] in {'png', 'jpg', 'jpeg'}:
            return jsonify({
                'filename': filename,
                'type': 'image',
                'content': f'/uploads/{filename}'
            })

        text = file_service.extract_text_from_file(filepath)
        return jsonify({
            'content': text,
            'filename': filename,
            'type': 'document'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000 ,static_folder='static', static_url_path='/static')