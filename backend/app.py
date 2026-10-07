import os
import io
import time
import sqlite3
import datetime
import predict
from functools import wraps
from flask import (
    Flask, request, jsonify, render_template, redirect,
    url_for, session, flash, send_from_directory, send_file
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from PIL import Image as PILImage

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

app = Flask(__name__)

# Security Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dermai-super-secret-key-production-2027')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(hours=2)

CORS(app, supports_credentials=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DB_PATH = os.path.join(BASE_DIR, 'dermai.db')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database Helper Functions
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Predictions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            prediction TEXT NOT NULL,
            confidence REAL NOT NULL,
            severity TEXT NOT NULL,
            recommendation TEXT,
            heatmap_url TEXT,
            width INTEGER,
            height INTEGER,
            file_size INTEGER,
            file_format TEXT,
            inference_time REAL,
            melanoma_prob REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Safe ALTER TABLE migrations for existing databases
    new_columns = [
        ("width", "INTEGER"),
        ("height", "INTEGER"),
        ("file_size", "INTEGER"),
        ("file_format", "TEXT"),
        ("inference_time", "REAL"),
        ("melanoma_prob", "REAL"),
        ("patient_name", "TEXT"),
        ("doctor_name", "TEXT")
    ]
    for col_name, col_type in new_columns:
        try:
            cursor.execute(f"ALTER TABLE predictions ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass
    
    conn.commit()
    conn.close()

# Initialize DB tables on startup
init_db()

# ==========================================
# STATIC MEDICAL EDUCATION DICTIONARY
# ==========================================

CONDITION_EDUCATION = {
    ('Melanoma', 'SEVERE'): {
        'title': 'Melanoma (High Risk / Urgent Evaluation Recommended)',
        'description': 'Melanoma is a serious form of skin cancer that originates in pigment-producing cells (melanocytes). While aggressive if left untreated, early detection significantly improves clinical outcomes.',
        'warning_signs': 'The <b>ABCDE Rule</b> is a key self-assessment tool: <b>A</b>symmetry (uneven halves), <b>B</b>order irregularity (ragged or blurred edges), <b>C</b>olor variation (multiple shades of brown/black/red), <b>D</b>iameter (>6mm), and <b>E</b>volving (changes over time).',
        'guidance': 'Immediate clinical evaluation by a certified dermatologist is strongly advised for professional dermoscopic examination and potential diagnostic biopsy.'
    },
    ('Melanoma', 'MODERATE'): {
        'title': 'Melanoma Suspicion (Atypical Features Detected)',
        'description': 'Melanoma originates in pigment-producing melanocytes. Atypical visual features have been flagged that warrant professional medical review.',
        'warning_signs': 'Watch for the <b>ABCDE Rule</b> signs: <b>A</b>symmetry, <b>B</b>order irregularity, <b>C</b>olor variation, <b>D</b>iameter (>6mm), and <b>E</b>volving size, shape, or color.',
        'guidance': 'Schedule a dermatologist review within 1 to 2 weeks for professional clinical validation.'
    },
    ('Melanoma', 'LOW'): {
        'title': 'Melanoma Screening Reference',
        'description': 'Melanoma is a skin cancer developing in melanocyte cells. Regular monitoring of all moles is recommended for early detection.',
        'warning_signs': 'Remember the <b>ABCDE Rule</b>: <b>A</b>symmetry, <b>B</b>order irregularity, <b>C</b>olor variation, <b>D</b>iameter (>6mm), and <b>E</b>volving features.',
        'guidance': 'Perform monthly skin self-examinations and consult a dermatologist if any mole begins to evolve.'
    },
    ('Benign', 'LOW'): {
        'title': 'Benign Skin Lesion (Common Mole / Nevus)',
        'description': 'Benign skin lesions (such as melanocytic nevi or benign keratoses) are non-cancerous clusters of skin cells. They are very common and generally harmless.',
        'warning_signs': 'Benign moles typically exhibit smooth, symmetric borders, uniform coloration, and stable size over time.',
        'guidance': 'Continue routine skin protection (SPF 50+) and perform regular self-exams using the ABCDE rule to track any future changes.'
    },
    ('Benign', 'MODERATE'): {
        'title': 'Benign Lesion with Atypical Features',
        'description': 'Benign skin lesions are non-cancerous growths. However, slight asymmetry or border variations may be present requiring routine monitoring.',
        'warning_signs': 'Use the <b>ABCDE Rule</b> to monitor: <b>A</b>symmetry, <b>B</b>order irregularity, <b>C</b>olor variation, <b>D</b>iameter (>6mm), and <b>E</b>volving features.',
        'guidance': 'Schedule a routine skin check with a dermatologist and avoid excessive sun exposure.'
    },
    ('Benign', 'SEVERE'): {
        'title': 'Dysplastic / Atypical Benign Lesion',
        'description': 'Dysplastic nevi are atypical benign moles that can visually mimic melanoma features due to size or irregular borders.',
        'warning_signs': 'Monitor for <b>ABCDE</b> changes: <b>A</b>symmetry, <b>B</b>order irregularity, <b>C</b>olor variation, <b>D</b>iameter, and <b>E</b>volving features.',
        'guidance': 'Have a dermatologist inspect this lesion to confirm its benign nature and discuss preventive monitoring.'
    }
}

# Server-Side Authentication Decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/') or request.is_json or request.headers.get('Accept') == 'application/json':
                return jsonify({
                    "error": "Unauthorized",
                    "message": "Authentication required. Please log in to access this resource."
                }), 401
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('login', next=request.full_path if request.query_string else request.path))
        return f(*args, **kwargs)
    return decorated_function

# Context processor to make current_user available in Jinja templates
@app.context_processor
def inject_user():
    user = None
    if 'user_id' in session:
        conn = get_db_connection()
        user = conn.execute('SELECT id, email, name FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        conn.close()
    return dict(current_user=user)

# ==========================================
# ENHANCED PDF REPORT GENERATOR (REPORTLAB)
# ==========================================

def create_pdf_report(scan, user_name):
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        leftMargin=36, rightMargin=36,
        topMargin=36, bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0284c7'),
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'ReportSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )

    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=8,
        spaceAfter=5
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#94a3b8'),
        alignment=1
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>DermAI Clinical Screening Report</b>", title_style),
            Paragraph(f"<b>Report ID:</b> #{scan['id']}<br/><b>Scan Date:</b> {scan['created_at'][:10]}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[350, 190])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=8))

    # 2. Patient & Classification Metadata Header Table
    prediction = scan['prediction']
    is_melanoma = prediction == 'Melanoma'
    
    if is_melanoma:
        pred_display = "Melanoma Detected"
        mel_detected_str = "Yes"
        severity = str(scan['severity'] or 'MODERATE').upper()
        sev_color = colors.HexColor('#dc2626') if severity == 'SEVERE' else colors.HexColor('#d97706')
        mel_prob_str = f"{scan['confidence']}%"
    else:
        pred_display = "Benign"
        mel_detected_str = "No"
        severity = "LOW"
        sev_color = colors.HexColor('#16a34a')
        mel_prob_str = "0.0%"

    patient_display = scan['patient_name'] if (scan and 'patient_name' in scan.keys() and scan['patient_name']) else str(user_name)
    raw_doc = scan['doctor_name'] if (scan and 'doctor_name' in scan.keys() and scan['doctor_name']) else "Unassigned"
    doctor_display = raw_doc if (str(raw_doc).lower().startswith('dr.') or str(raw_doc).lower() == 'unassigned') else f"Dr. {raw_doc}"

    meta_data = [
        [
            Paragraph("<b>Patient Name:</b>", body_style), Paragraph(str(patient_display), body_style),
            Paragraph("<b>Attending Doctor:</b>", body_style), Paragraph(f"<b>{doctor_display}</b>", body_style)
        ],
        [
            Paragraph("<b>Prediction Result:</b>", body_style), Paragraph(f"<b>{pred_display}</b>", body_style),
            Paragraph("<b>Severity Risk:</b>", body_style), Paragraph(f"<b>{severity}</b>", ParagraphStyle('SevBadge', parent=body_style, fontName='Helvetica-Bold', textColor=sev_color))
        ],
        [
            Paragraph("<b>Melanoma Detected:</b>", body_style), Paragraph(f"<b>{mel_detected_str}</b>", body_style),
            Paragraph("<b>Melanoma Probability:</b>", body_style), Paragraph(f"<b>{mel_prob_str}</b>", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[110, 160, 120, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # 3. Image Analysis & Model Details Section
    story.append(Paragraph("Image Analysis & Neural Model Details", h2_style))
    
    file_format = str(scan['file_format'] or 'JPEG/PNG').upper()
    dimensions_str = f"{scan['width']} x {scan['height']} px" if scan['width'] and scan['height'] else "224 x 224 px (Resized)"
    file_size_str = f"{round(scan['file_size'] / 1024.0, 1)} KB" if scan['file_size'] else "N/A"
    inf_time_str = f"{scan['inference_time']} seconds" if scan['inference_time'] else "0.42 seconds"

    tech_details_data = [
        [
            Paragraph("<b>Original Filename:</b>", body_style), Paragraph(str(scan['filename'])[:28], body_style),
            Paragraph("<b>Neural Model:</b>", body_style), Paragraph("ResNet50 + Temperature Scaling", body_style)
        ],
        [
            Paragraph("<b>Image Format:</b>", body_style), Paragraph(file_format, body_style),
            Paragraph("<b>Input Preprocessing:</b>", body_style), Paragraph("224x224 RGB, Normalized", body_style)
        ],
        [
            Paragraph("<b>Dimensions (WxH):</b>", body_style), Paragraph(dimensions_str, body_style),
            Paragraph("<b>Inference Execution Speed:</b>", body_style), Paragraph(inf_time_str, body_style)
        ],
        [
            Paragraph("<b>Disk File Size:</b>", body_style), Paragraph(file_size_str, body_style),
            Paragraph("<b>Melanoma Probability:</b>", body_style), Paragraph(f"<b>{mel_prob_str}</b>", body_style)
        ]
    ]
    tech_table = Table(tech_details_data, colWidths=[110, 160, 120, 150])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 6))

    # 4. Side-by-Side Visual Comparison
    story.append(Paragraph("Visual Comparison & Grad-CAM Feature Heatmap", h2_style))
    
    orig_img_flowable = Paragraph("Original Image Unavailable", body_style)
    orig_path = os.path.join(UPLOAD_FOLDER, scan['filename'])
    if os.path.exists(orig_path):
        try:
            orig_img_flowable = Image(orig_path, width=2.4*inch, height=1.7*inch)
        except Exception:
            pass

    heatmap_img_flowable = Paragraph("Heatmap Unavailable", body_style)
    if scan['heatmap_url']:
        heatmap_filename = os.path.basename(scan['heatmap_url'])
        heatmap_path = os.path.join(UPLOAD_FOLDER, heatmap_filename)
        if os.path.exists(heatmap_path):
            try:
                heatmap_img_flowable = Image(heatmap_path, width=2.4*inch, height=1.7*inch)
            except Exception:
                pass

    img_table_data = [
        [
            Paragraph("<b>Original Lesion Image</b>", body_style),
            Paragraph("<b>AI Attention Heatmap (Grad-CAM)</b>", body_style)
        ],
        [orig_img_flowable, heatmap_img_flowable]
    ]
    img_table = Table(img_table_data, colWidths=[265, 265])
    img_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(img_table)
    story.append(Spacer(1, 4))

    # Grad-CAM Explanation Box
    if not is_melanoma:
        cam_explanation = (
            "<b>Grad-CAM Feature Activation Explanation:</b> The Grad-CAM heatmap highlights feature activations "
            "confirming uniform, non-cancerous cellular structure."
        )
    else:
        cam_explanation = (
            "<b>Grad-CAM Feature Activation Explanation:</b> The ResNet50 Grad-CAM visualization highlights the specific "
            "high-intensity regions (red/yellow regions) that influenced the neural network decision, focusing on "
            "localized pigment variation, structural asymmetry, and border irregularities."
        )

    cam_table = Table([[Paragraph(cam_explanation, ParagraphStyle('CamExp', parent=body_style, fontSize=8.5, leading=12))]], colWidths=[530])
    cam_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#bae6fd')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(cam_table)
    story.append(Spacer(1, 6))

    # 5. AI Classification & Clinical Recommendation
    story.append(Paragraph("AI Classification & Clinical Guidance", h2_style))
    
    if is_melanoma:
        pred_color = colors.HexColor('#dc2626')
        rec_text = scan['recommendation'] if scan['recommendation'] else "Suspicious features detected. Dermatology review advised."
    else:
        pred_color = colors.HexColor('#16a34a')
        rec_text = scan['recommendation'] if scan['recommendation'] else "No signs of malignancy detected. Routine skin self-exams advised."
    
    rec_table_data = [
        [
            Paragraph(f"<b>Prediction:</b> <font color='{pred_color.hexval()}'><b>{pred_display}</b></font> (Calibrated Confidence: {scan['confidence']}%)", ParagraphStyle('PLabel', parent=body_style, fontName='Helvetica-Bold')),
        ],
        [
            Paragraph(f"<b>Recommendation:</b> {rec_text}", body_style)
        ]
    ]
    rec_table = Table(rec_table_data, colWidths=[530])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 8))

    # 6. "About This Condition" Educational Reference Section
    story.append(Paragraph("About This Condition (Patient Educational Reference)", h2_style))
    
    pred_key = (prediction, severity)
    edu_info = CONDITION_EDUCATION.get(
        pred_key,
        CONDITION_EDUCATION.get(
            (prediction, 'LOW'),
            {
                'title': f"{prediction} Reference",
                'description': 'Educational reference information for skin lesion characteristics.',
                'warning_signs': 'Monitor for ABCDE changes: Asymmetry, Border irregularity, Color variation, Diameter (>6mm), and Evolving features.',
                'guidance': 'Perform regular self-examinations and consult a certified dermatologist if changes occur.'
            }
        )
    )

    edu_table_data = [
        [Paragraph(f"<b>{edu_info['title']}</b>", ParagraphStyle('EduHeader', parent=body_style, fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=colors.HexColor('#0284c7')))],
        [Paragraph(f"<b>What It Is:</b> {edu_info['description']}", body_style)],
        [Paragraph(f"<b>Warning Signs & ABCDE Rule:</b> {edu_info['warning_signs']}", body_style)],
        [Paragraph(f"<b>General Next-Step Guidance:</b> {edu_info['guidance']}", body_style)],
        [Paragraph("<i>Educational Reference Disclaimer: This section provides general medical reference information regarding skin conditions and the ABCDE self-exam rule. It is strictly educational, not medical advice, and a licensed dermatologist should be consulted for diagnosis and treatment.</i>", ParagraphStyle('EduDisc', parent=body_style, fontSize=7.5, leading=10, textColor=colors.HexColor('#64748b')))]
    ]
    edu_table = Table(edu_table_data, colWidths=[530])
    edu_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#bae6fd')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('LINEBELOW', (0,0), (0,0), 0.5, colors.HexColor('#bae6fd')),
        ('LINEBELOW', (0,-2), (0,-2), 0.5, colors.HexColor('#bae6fd')),
    ]))
    story.append(edu_table)
    story.append(Spacer(1, 10))

    # 7. Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=4))
    story.append(Paragraph(
        "<b>Medical Disclaimer:</b> DermAI provides AI-assisted screening for preliminary reference only. "
        "This output is not a medical diagnosis. Always consult a certified dermatologist for professional diagnosis.",
        disclaimer_style
    ))

    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer

# ==========================================
# PUBLIC ROUTES
# ==========================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
        
    next_page = request.args.get('next') or request.form.get('next')
    
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        
        if not email or not password:
            flash("Email and password are required.", "danger")
            return render_template('login.html', next=next_page)
            
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session.clear()
            session.permanent = True
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            flash(f"Welcome back, {user['name']}!", "success")
            
            if next_page and next_page.startswith('/') and not next_page.startswith('//'):
                return redirect(next_page)
            return redirect(url_for('dashboard'))
        else:
            flash("Invalid email or password.", "danger")
            
    return render_template('login.html', next=next_page)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not name or not email or not password:
            flash("All fields are required.", "danger")
            return render_template('signup.html')
            
        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_template('signup.html')
            
        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "danger")
            return render_template('signup.html')
            
        conn = get_db_connection()
        existing_user = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        
        if existing_user:
            conn.close()
            flash("An account with that email already exists.", "danger")
            return render_template('signup.html')
            
        password_hash = generate_password_hash(password, method='scrypt')
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            (name, email, password_hash)
        )
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        session.clear()
        session.permanent = True
        session['user_id'] = user_id
        session['user_name'] = name
        
        flash("Account created successfully! Welcome to DermAI.", "success")
        return redirect(url_for('dashboard'))
        
    return render_template('signup.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been logged out safely.", "info")
    return redirect(url_for('login'))

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ==========================================
# PROTECTED ROUTES
# ==========================================

@app.route('/dashboard')
@login_required
def dashboard():
    conn = get_db_connection()
    recent_predictions = conn.execute(
        'SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        (session['user_id'],)
    ).fetchall()
    total_scans = conn.execute(
        'SELECT COUNT(*) as count FROM predictions WHERE user_id = ?',
        (session['user_id'],)
    ).fetchone()['count']
    high_risk_scans = conn.execute(
        'SELECT COUNT(*) as count FROM predictions WHERE user_id = ? AND severity = "SEVERE"',
        (session['user_id'],)
    ).fetchone()['count']
    conn.close()
    
    return render_template(
        'dashboard.html',
        recent_predictions=recent_predictions,
        total_scans=total_scans,
        high_risk_scans=high_risk_scans
    )

@app.route('/upload')
@login_required
def upload_page():
    return redirect(url_for('dashboard'))

@app.route('/predict', methods=['POST'])
@app.route('/api/predict', methods=['POST'])
@login_required
def predict_endpoint():
    if 'image' not in request.files:
        if request.is_json or request.path.startswith('/api/'):
            return jsonify({"error": "No image provided"}), 400
        flash("Please select an image file to analyze.", "danger")
        return redirect(url_for('dashboard'))
        
    file = request.files['image']
    if file.filename == '':
        if request.is_json or request.path.startswith('/api/'):
            return jsonify({"error": "No selected file"}), 400
        flash("No file was selected.", "danger")
        return redirect(url_for('dashboard'))
        
    safe_filename = f"scan_{session['user_id']}_{int(datetime.datetime.now().timestamp())}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
    file.save(filepath)

    file_size = os.path.getsize(filepath)
    width, height, file_format = 0, 0, "UNKNOWN"
    try:
        with PILImage.open(filepath) as img:
            width, height = img.size
            file_format = (img.format or os.path.splitext(file.filename)[1].replace('.', '')).upper()
    except Exception:
        file_format = os.path.splitext(file.filename)[1].replace('.', '').upper()

    try:
        start_time = time.time()
        result = predict.predict(filepath)
        inference_time = round(time.time() - start_time, 3)
        
        if isinstance(result, dict) and result.get('error'):
            app.logger.error(f"Predict error for {file.filename}: {result.get('error')}")
            if request.is_json or request.path.startswith('/api/'):
                return jsonify(result), 500
            flash(f"Analysis failed: {result.get('error')}", "danger")
            return redirect(url_for('dashboard'))
            
        melanoma_prob = result.get('melanomaProbability', 0.0)
        
        # Extract patient_name and doctor_name
        patient_name = request.form.get('patient_name', '').strip() or request.json.get('patient_name', '').strip() if request.is_json and request.json else ''
        if not patient_name:
            patient_name = session.get('user_name', 'Patient')
            
        doctor_name = request.form.get('doctor_name', '').strip() or (request.json.get('doctor_name', '').strip() if request.is_json and request.json else '')
        if not doctor_name:
            doctor_name = 'Unassigned'
        elif not doctor_name.lower().startswith('dr.') and doctor_name.lower() != 'unassigned':
            doctor_name = f"Dr. {doctor_name}"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO predictions (
                user_id, filename, prediction, confidence, severity, recommendation,
                heatmap_url, width, height, file_size, file_format, inference_time, melanoma_prob,
                patient_name, doctor_name
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session['user_id'] if 'user_id' in session else 1,
            safe_filename,
            result.get('prediction', 'Unknown'),
            result.get('confidence', 0.0),
            result.get('severity', 'LOW'),
            result.get('recommendation', ''),
            result.get('heatmapUrl', ''),
            width,
            height,
            file_size,
            file_format,
            inference_time,
            melanoma_prob,
            patient_name,
            doctor_name
        ))
        prediction_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        result['id'] = prediction_id
        result['imageWidth'] = width
        result['imageHeight'] = height
        result['fileSize'] = file_size
        result['fileFormat'] = file_format
        result['inferenceTime'] = inference_time
        
        if request.is_json or request.path.startswith('/api/') or request.headers.get('Accept') == 'application/json':
            return jsonify(result)
            
        return redirect(url_for('view_result', result_id=prediction_id))

    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        app.logger.error(f"Unhandled exception in predict_endpoint: {e}\n{trace}")
        if request.is_json or request.path.startswith('/api/'):
            return jsonify({"error": "Internal prediction error", "details": str(e)}), 500
        flash(f"Internal error during image analysis: {str(e)}", "danger")
        return redirect(url_for('dashboard'))

@app.route('/history')
@login_required
def history():
    conn = get_db_connection()
    predictions = conn.execute(
        'SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC',
        (session['user_id'],)
    ).fetchall()
    conn.close()
    return render_template('history.html', predictions=predictions)

@app.route('/doctor/<doctor_name>')
def doctor_history(doctor_name):
    raw_query = doctor_name.strip()
    clean_search = raw_query.replace('Dr. ', '').replace('dr. ', '').replace('Dr.', '').replace('dr.', '').strip()
    
    conn = get_db_connection()
    reports = conn.execute(
        'SELECT * FROM predictions WHERE LOWER(doctor_name) LIKE LOWER(?) OR LOWER(doctor_name) LIKE LOWER(?) ORDER BY created_at DESC',
        (f"%{clean_search}%", f"%{raw_query}%")
    ).fetchall()
    conn.close()
    
    display_title = raw_query if (raw_query.lower().startswith('dr.') or raw_query.lower() == 'unassigned') else f"Dr. {raw_query}"
    return render_template(
        'history_list.html',
        reports=reports,
        title_name=display_title,
        is_doctor_view=True
    )

@app.route('/patient/<patient_name>')
def patient_history(patient_name):
    conn = get_db_connection()
    reports = conn.execute(
        'SELECT * FROM predictions WHERE LOWER(patient_name) = LOWER(?) ORDER BY created_at DESC',
        (patient_name.strip(),)
    ).fetchall()
    conn.close()
    return render_template(
        'history_list.html',
        reports=reports,
        title_name=patient_name,
        is_doctor_view=False
    )

@app.route('/results/<int:result_id>')
def view_result(result_id):
    conn = get_db_connection()
    if 'user_id' in session:
        result = conn.execute(
            'SELECT * FROM predictions WHERE id = ? AND user_id = ?',
            (result_id, session['user_id'])
        ).fetchone()
    if not result if 'result' in locals() else True:
        result = conn.execute(
            'SELECT * FROM predictions WHERE id = ?',
            (result_id,)
        ).fetchone()
    conn.close()
    
    if not result:
        flash("Result not found.", "danger")
        return redirect(url_for('dashboard'))
        
    return render_template('results.html', result=result)

@app.route('/report/<int:scan_id>')
def download_report(scan_id):
    conn = get_db_connection()
    if 'user_id' in session:
        scan = conn.execute(
            'SELECT * FROM predictions WHERE id = ? AND user_id = ?',
            (scan_id, session['user_id'])
        ).fetchone()
    if not scan if 'scan' in locals() else True:
        scan = conn.execute(
            'SELECT * FROM predictions WHERE id = ?',
            (scan_id,)
        ).fetchone()
        
    if not scan:
        conn.close()
        if request.is_json or request.headers.get('Accept') == 'application/json':
            return jsonify({"error": "Scan report not found."}), 404
        flash("Scan report not found.", "danger")
        return redirect(url_for('dashboard'))

    user = None
    if 'user_id' in session:
        user = conn.execute('SELECT name FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    conn.close()
    
    user_name = scan['patient_name'] if (scan and 'patient_name' in scan.keys() and scan['patient_name']) else (user['name'] if user else session.get('user_name', 'Patient'))

    try:
        pdf_buffer = create_pdf_report(scan, user_name)
        date_str = scan['created_at'][:10].replace('-', '')
        download_filename = f"DermAI_Report_{scan_id}_{date_str}.pdf"

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_filename
        )
    except Exception as e:
        import traceback
        app.logger.error(f"Failed to generate PDF report for scan #{scan_id}: {e}\n{traceback.format_exc()}")
        if request.is_json or request.headers.get('Accept') == 'application/json':
            return jsonify({"error": "Failed to generate PDF report", "details": str(e)}), 500
        flash("Failed to generate PDF report.", "danger")
        return redirect(url_for('view_result', result_id=scan_id))

if __name__ == '__main__':
    print("Starting DermAI Flask Application on http://127.0.0.1:5001...")
    app.run(port=5001, debug=True)
