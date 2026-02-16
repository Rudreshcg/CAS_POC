from flask import Flask, request, Response, send_file, jsonify, send_from_directory
print("STARTING APP V4 - Modular Refactor")
from flask_cors import CORS
import os
from sqlalchemy import text

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for React frontend
CORS(app, resources={
    r"/upload": {"origins": "*"},
    r"/process/*": {"origins": "*"},
    r"/download/*": {"origins": "*"},
    r"/clusters": {"origins": "*"},
    r"/api/*": {"origins": "*"}
})

# Configure static folder for React frontend
current_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(current_dir) == 'backend':
    app.static_folder = os.path.abspath(os.path.join(current_dir, '../frontend/dist'))
else:
    app.static_folder = os.path.abspath(os.path.join(current_dir, 'frontend/dist'))

print(f"🔧 Static folder configured: {app.static_folder}")

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['CAS_API_KEY'] = "XBr7txDIgp8FNY3ziNqaqRFiTShZBdb3V3GN3QAb"

# S3 Configuration for Validation Docs
app.config['S3_BUCKET'] = os.environ.get('S3_VALIDATION_BUCKET', '')
app.config['USE_S3'] = bool(app.config['S3_BUCKET'])

# Create folders if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Database Configuration
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cas_database.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Import and initialize models
from models import db, UserPreference
db.init_app(app)

# Register Blueprints
from blueprints.spend import spend_bp, init_spend_data
from blueprints.material import material_bp
from blueprints.enrichment import enrichment_bp

app.register_blueprint(spend_bp)
app.register_blueprint(material_bp)
app.register_blueprint(enrichment_bp)

with app.app_context():
    db.create_all()
    # Migration hacks
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE enrichment_rule ADD COLUMN purity_rules TEXT DEFAULT '[]'"))
            conn.commit()
    except: pass
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE enrichment_rule ADD COLUMN hierarchy TEXT DEFAULT '[\"Region\", \"Identifier\", \"Factory\"]'"))
            conn.commit()
    except: pass

# ==========================================
# COMMON ROUTES
# ==========================================

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/user-preferences', methods=['GET'])
def get_user_preferences():
    key = request.args.get('key')
    query = UserPreference.query
    if key:
        query = query.filter_by(key=key)
    prefs = query.all()
    return jsonify({p.key: p.value for p in prefs})

@app.route('/api/user-preferences', methods=['POST'])
def save_user_preference():
    data = request.json
    if not data or 'key' not in data or 'value' not in data:
        return jsonify({"error": "Invalid data"}), 400
    
    key = data['key']
    value = data['value']
    pref = UserPreference.query.filter_by(key=key).first()
    if pref:
        pref.value = value
    else:
        db.session.add(UserPreference(key=key, value=value))
    db.session.commit()
    return jsonify({"success": True})

if __name__ == '__main__':
    with app.app_context():
        init_spend_data()
    app.run(debug=True, host='0.0.0.0', port=5000)

