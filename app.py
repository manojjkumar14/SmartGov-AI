from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from google import genai
import sqlite3
import json
import os
from google import genai
from dotenv import load_dotenv
load_dotenv()

# ---------------- DATABASE MIGRATION ----------------
def run_migrations():
    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()
    
    # Create tables if they do not exist
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Drop schemes table if it exists to cleanly recreate with audited data model
    cursor.execute("DROP TABLE IF EXISTS schemes")
    
    # Create schemes table for personalized recommendations
    cursor.execute("""
    CREATE TABLE schemes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        state TEXT,
        occupation TEXT,
        min_age INTEGER,
        max_age INTEGER,
        max_income INTEGER,
        benefits TEXT NOT NULL,
        documents_required TEXT NOT NULL,
        application_url TEXT,
        source TEXT NOT NULL,
        last_verified TEXT NOT NULL,
        active_status INTEGER DEFAULT 1,
        target_groups TEXT,
        income_condition TEXT,
        other_eligibility TEXT,
        application_process TEXT,
        application_start_date TEXT,
        application_end_date TEXT,
        important_dates TEXT,
        official_website TEXT,
        source_url TEXT
    )
    """)
    conn.commit()
    
    # Create user_profiles table for search persistence
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
        email TEXT PRIMARY KEY,
        occupation TEXT,
        age INTEGER,
        annual_income INTEGER,
        state TEXT
    )
    """)
    
    # Recreate user_locations table with user_id to correctly scope coordinates
    cursor.execute("DROP TABLE IF EXISTS user_locations")
    cursor.execute("""
    CREATE TABLE user_locations (
        user_id INTEGER PRIMARY KEY,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        state TEXT,
        district TEXT,
        city TEXT,
        country TEXT,
        location_source TEXT,
        location_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    
    # Safe migration: Add conversation_id column to chat_history if not present
    try:
        cursor.execute("ALTER TABLE chat_history ADD COLUMN conversation_id TEXT;")
        conn.commit()
    except sqlite3.OperationalError:
        pass
        
    # Safe migration: Add detected_state column to user_profiles if not present
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN detected_state TEXT;")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    # Update NULL conversation_ids to 'legacy' to preserve existing history data
    cursor.execute("UPDATE chat_history SET conversation_id = 'legacy' WHERE conversation_id IS NULL OR conversation_id = '';")
    conn.commit()
    
    # Seed baseline audited schemes
    seed_schemes = [
        (
            "pm-kisan", 
            "PM Kisan Samman Nidhi", 
            "Agriculture", 
            "Financial assistance program providing income support to all landholding farmer families across the country.", 
            "All", 
            "Farmer", 
            18, 
            None, 
            None, 
            "₹6,000 per year payable in three equal installments of ₹2,000 every four months.", 
            "Aadhaar Card, Land ownership papers, Bank account details.", 
            "https://pmkisan.gov.in/", 
            "Department of Agriculture and Farmers Welfare", 
            "2026-08-10",
            1,
            "Landholding farmer families",
            "No specific income limit stated.",
            "Must be a land-owning farmer family.",
            "1. Prepare Aadhaar and land ownership records.\n2. Register online via the PM-KISAN portal or visit your nearest Common Service Centre (CSC).\n3. Local revenue authorities will verify your land documents and approve enrollment.",
            None,
            None,
            "No fixed application deadline specified.",
            "https://pmkisan.gov.in/",
            "https://pmkisan.gov.in/"
        ),
        (
            "post-matric", 
            "Post Matric Scholarship Scheme", 
            "Education", 
            "Scholarship for students belonging to marginalized categories pursuing post-matriculation or post-secondary courses.", 
            "All", 
            "Student", 
            15, 
            30, 
            250000, 
            "Full tuition fee reimbursement and monthly maintenance allowance.", 
            "Aadhaar Card, Income Certificate, Caste Certificate, Previous Marksheets, Fee Receipt.", 
            "https://scholarships.gov.in/", 
            "Ministry of Social Justice and Empowerment", 
            "2026-08-11",
            1,
            "Students from Scheduled Caste (SC), Scheduled Tribe (ST), or OBC categories",
            "Annual family income must not exceed ₹2.5 Lakhs.",
            "Must belong to Scheduled Caste (SC), Scheduled Tribe (ST), or Other Backward Classes (OBC) and must be enrolled in an approved post-matriculation course.",
            "1. Register on the National Scholarship Portal (NSP).\n2. Complete the scholarship form and upload caste, income and enrollment receipts.\n3. Submit application online for institutional and state verification.",
            "01-07-2026",
            "31-10-2026",
            "Application Period: July to October annually.",
            "https://scholarships.gov.in/",
            "https://socialjustice.gov.in/"
        ),
        (
            "mudra-loan", 
            "Pradhan Mantri Mudra Yojana", 
            "Startup", 
            "Provides loans up to ₹10 Lakhs to non-corporate, non-farm small/micro enterprises to help start or expand businesses.", 
            "All", 
            "Business Owner, Self-employed, Entrepreneur", 
            18, 
            65, 
            None, 
            "Collateral-free business loans up to ₹10 Lakhs categorized under Shishu, Kishor, and Tarun stages.", 
            "Identity Proof, Address Proof, Business license, Quotation of machinery/equipment to be purchased.", 
            "https://www.mudra.org.in/", 
            "Micro Units Development & Refinance Agency Ltd (MUDRA)", 
            "2026-08-08",
            1,
            "Small and micro enterprises, startup founders, retail and service sector entrepreneurs",
            "No specific income limit stated.",
            "Non-farm, non-corporate small/micro enterprises.",
            "1. Formulate a business proposal and obtain machinery purchase quotations.\n2. Submit Mudra application form along with business license and ID proof to participating commercial/cooperative banks.\n3. The bank reviews business viability and issues collateral-free credit.",
            None,
            None,
            "No fixed application deadline specified.",
            "https://www.mudra.org.in/",
            "https://www.mudra.org.in/"
        ),
        (
            "atal-pension", 
            "Atal Pension Yojana", 
            "Pension", 
            "Pension scheme focused on unorganized sector workers, allowing them to save for their retirement years.", 
            "All", 
            None, 
            18, 
            40, 
            None, 
            "Guaranteed minimum monthly pension of ₹1,000 to ₹5,000 after reaching age 60.", 
            "Aadhaar Card, Active savings bank account.", 
            "https://www.npscra.nsdl.co.in/", 
            "Pension Fund Regulatory and Development Authority (PFRDA)", 
            "2026-08-14",
            1,
            "Unorganized sector workers, self-employed individuals, and homemakers",
            "Must not be an active income tax payer.",
            "Must have an active savings bank account and must not be covered under any statutory social security schemes.",
            "1. Visit the bank holding your savings account.\n2. Fill out the APY enrollment form providing your bank details and Aadhaar number.\n3. Choose your desired target pension (₹1,000 - ₹5,000) and authorize auto-debit contributions.",
            None,
            None,
            "No fixed application deadline specified.",
            "https://www.npscra.nsdl.co.in/",
            "https://www.npscra.nsdl.co.in/"
        ),
        (
            "ma-yojana", 
            "Mukhyamantri Amrutam Yojana", 
            "Healthcare", 
            "Tertiary health care scheme for families living below the poverty line (BPL) and lower-income families in Gujarat.", 
            "Gujarat", 
            None, 
            None, 
            None, 
            400000, 
            "Cashless medical treatment up to ₹5 Lakhs per family per year for designated critical illnesses.", 
            "MA Card, Income Certificate, Identity Proof, Ration Card.", 
            "https://magujarat.com/", 
            "Department of Health and Family Welfare, Government of Gujarat", 
            "2026-08-12",
            1,
            "BPL families and lower income families in Gujarat",
            "Annual family income must be below ₹4 Lakhs.",
            "Must be a domicile of Gujarat and belong to BPL cardholder or lower-income families.",
            "1. Visit local taluka civic office, district collectorate, or designated civil hospital.\n2. Present BPL card, income certificate and identity proofs.\n3. Enroll biometric fingerprints and receive your MA card from the officer.",
            None,
            None,
            "No fixed application deadline specified.",
            "https://magujarat.com/",
            "https://health.gujarat.gov.in/"
        ),
        (
            "lado-protsahan", 
            "Lado Protsahan Yojana", 
            "Women", 
            "Financial incentive scheme in Rajasthan promoting higher education and delaying marriage age for girls.", 
            "Rajasthan", 
            None, 
            0, 
            25, 
            None, 
            "Savings bond of ₹1 Lakh matured at age 21 for girl child born in eligible families.", 
            "Birth certificate of girl child, Jan Aadhaar Card, Parent's identity proof, Domicile certificate of Rajasthan.", 
            "https://sje.rajasthan.gov.in/", 
            "Department of Women and Child Development, Government of Rajasthan", 
            "2026-08-05",
            1,
            "Girl children born in weaker category families in Rajasthan",
            "No specific income limit stated.",
            "Must be a domicile of Rajasthan. Applicable to girl children born in eligible weaker category families.",
            "1. Prepare the child's birth certificate and family Jan Aadhaar Card.\n2. Submit the registration application online on the Rajasthan SJE portal or at any Emitra kiosk.\n3. DWCD registers and issues the savings bond details.",
            None,
            None,
            "No fixed application deadline specified.",
            "https://sje.rajasthan.gov.in/",
            "https://wcd.rajasthan.gov.in/"
        ),
        (
            "nmm-scholarship", 
            "National Means-cum-Merit Scholarship", 
            "Education", 
            "Scholarship scheme to award financial support to meritorious students of economically weaker sections to arrest dropouts.", 
            "All", 
            "Student", 
            10, 
            18, 
            350000, 
            "Scholarship of ₹12,000 per annum for studying in classes IX to XII in government schools.", 
            "Income Certificate of parents, Class VII marksheet, Aadhaar Card.", 
            "https://scholarships.gov.in/", 
            "Ministry of Education, Government of India", 
            "2026-08-15",
            1,
            "Meritorious students studying in Government or Government-aided schools",
            "Annual parental income must not exceed ₹3.5 Lakhs.",
            "Must study in a government, government-aided, or local body school, and have at least 55% marks in Class VIII exam (relaxable for reserved categories).",
            "1. Register on the NSP portal.\n2. Enter academic credentials and parent income.\n3. Pass the state-level Means-cum-Merit Scholarship examination.",
            "01-08-2026",
            "30-11-2026",
            "Application Period: August to November annually.",
            "https://scholarships.gov.in/",
            "https://education.gov.in/"
        ),
        (
            "standup-india", 
            "Stand-Up India Scheme", 
            "Startup", 
            "Bank loans for setting up greenfield enterprises by women, Scheduled Caste (SC), or Scheduled Tribe (ST) borrowers.", 
            "All", 
            "Entrepreneur, Business Owner", 
            18, 
            None, 
            None, 
            "Bank loans between ₹10 Lakhs and ₹1 Crore covering up to 75% of project cost.", 
            "Business proposal, Caste certificate, Income statement, Identity proofs.", 
            "https://www.standupmitra.in/", 
            "Small Industries Development Bank of India (SIDBI)", 
            "2026-08-09",
            1,
            "SC, ST, and Women entrepreneurs",
            "No specific income limit stated.",
            "Must be a woman, SC, or ST entrepreneur setting up a greenfield enterprise. Loan borrower must hold at least 51% stake in the business.",
            "1. Access the Stand-Up Mitra portal and register.\n2. Complete application form indicating ready borrower/trainee borrower status.\n3. Submit business plan for automatic routing and review by SIDBI partner bank offices.",
            None,
            None,
            "No fixed application deadline specified.",
            "https://www.standupmitra.in/",
            "https://www.standupmitra.in/"
        )
    ]
    cursor.executemany("""
        INSERT INTO schemes 
        (id, name, category, description, state, occupation, min_age, max_age, max_income, benefits, documents_required, application_url, source, last_verified, active_status, target_groups, income_condition, other_eligibility, application_process, application_start_date, application_end_date, important_dates, official_website, source_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, seed_schemes)
    conn.commit()
    conn.close()

# ---------------- DETERMINISTIC ELIGIBILITY MATCHING ENGINE ----------------

def check_eligibility(user_profile, scheme):
    # user_profile: dict with keys (state, occupation, age, annual_income)
    # scheme: dict containing structured columns
    
    match_status = "high_match"
    matched_criteria = []
    missing_information = []
    explanation = []
    is_eligible = True
    
    # 1. State Match
    s_state = scheme.get("state")
    u_state = user_profile.get("state")
    
    if s_state and s_state.lower() != "all" and s_state.lower() != "all states":
        if u_state:
            if u_state.lower() == s_state.lower():
                matched_criteria.append("state")
                explanation.append(f"✓ The scheme is available in your state ({s_state}).")
            else:
                is_eligible = False
                explanation.append(f"✕ This scheme is only available in {s_state} (your state is {u_state}).")
        else:
            missing_information.append("state")
            explanation.append(f"⚠ State eligibility requires verification (this scheme is only available in {s_state}).")
    else:
        matched_criteria.append("state")
        explanation.append("✓ This scheme is open nationwide across all States/UTs.")
        
    # 2. Occupation Match
    s_occ = scheme.get("occupation")
    u_occ = user_profile.get("occupation")
    
    if s_occ and s_occ.lower() != "all" and s_occ.lower() != "no occupation restriction specified":
        s_occ_list = [o.strip().lower() for o in s_occ.split(",")]
        if u_occ:
            if u_occ.lower() in s_occ_list:
                matched_criteria.append("occupation")
                explanation.append(f"✓ Your occupation ({u_occ}) matches the target group.")
            else:
                is_eligible = False
                explanation.append(f"✕ This scheme targets: {s_occ} (your occupation is {u_occ}).")
        else:
            missing_information.append("occupation")
            explanation.append(f"⚠ Occupation eligibility requires verification (scheme targets {s_occ}).")
    else:
        matched_criteria.append("occupation")
        explanation.append("✓ No specific occupation restriction is specified.")
        
    # 3. Age Match
    min_age = scheme.get("min_age")
    max_age = scheme.get("max_age")
    u_age = user_profile.get("age")
    
    age_restricted = (min_age is not None and min_age > 0) or (max_age is not None and max_age < 120)
    if age_restricted:
        if min_age is not None and max_age is not None:
            range_text = f"{min_age}-{max_age} years"
        elif min_age is not None:
            range_text = f"above {min_age} years"
        else:
            range_text = f"below {max_age} years"
            
        if u_age is not None:
            age_ok = True
            if min_age is not None and u_age < min_age:
                age_ok = False
            if max_age is not None and u_age > max_age:
                age_ok = False
                
            if age_ok:
                matched_criteria.append("age")
                explanation.append(f"✓ Your age ({u_age}) meets the eligibility range ({range_text}).")
            else:
                is_eligible = False
                explanation.append(f"✕ Your age ({u_age}) does not meet the eligibility range ({range_text}).")
        else:
            missing_information.append("age")
            explanation.append(f"⚠ Age eligibility requires verification (scheme requires {range_text}).")
    else:
        matched_criteria.append("age")
        explanation.append("✓ No specific age limit is stated.")
        
    # 4. Income Match
    max_inc = scheme.get("max_income")
    u_inc = user_profile.get("annual_income")
    
    if max_inc is not None:
        if u_inc is not None:
            if u_inc <= max_inc:
                matched_criteria.append("income")
                explanation.append(f"✓ Your annual family income (₹{u_inc:,}) is within the limit (below ₹{max_inc:,}).")
            else:
                is_eligible = False
                explanation.append(f"✕ Your annual family income (₹{u_inc:,}) exceeds the scheme's limit of ₹{max_inc:,}.")
        else:
            missing_information.append("income")
            explanation.append(f"⚠ Income eligibility requires verification (scheme limit is below ₹{max_inc:,}).")
    else:
        matched_criteria.append("income")
        explanation.append("✓ No specific family income limit is specified.")

    # 5. Other eligibility / Caste / Greenfield conditions
    other_elig = scheme.get("other_eligibility")
    if other_elig and is_eligible:
        explanation.append(f"ℹ Additional condition: {other_elig}")
        
    # Classification logic
    if not is_eligible:
        match_status = "not_eligible"
    elif len(missing_information) >= 3:
        match_status = "low_match"
    elif len(missing_information) > 0:
        match_status = "potential_match"
    elif other_elig:
        match_status = "needs_verification"
    else:
        match_status = "high_match"
        
    return {
        "match_status": match_status,
        "matched_criteria": matched_criteria,
        "missing_information": missing_information,
        "explanation": explanation
    }

run_migrations()

app = Flask(__name__)
app.secret_key = "smartgov_secret_key"

# Gemini Client
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError(
        "GOOGLE_API_KEY environment variable is not set."
    )

client = genai.Client(api_key=GOOGLE_API_KEY)

# ---------------- HOME ----------------

@app.route("/")
def home():
    return render_template("index.html")


# ---------------- LOGIN ----------------

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        conn = sqlite3.connect("smartgov.db")
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT * FROM users
            WHERE email=? AND password=?
            """,
            (email, password)
        )

        user = cursor.fetchone()

        conn.close()

        if user:
            session["user"] = email
            session["user_id"] = user[0] # Store unique auto-increment user ID
            return redirect(url_for("chatbot"))

        return render_template(
            "login.html",
            error="Invalid Email or Password"
        )

    return render_template("login.html")


# ---------------- SIGNUP ----------------

@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        fullname = request.form.get("fullname")
        email = request.form.get("email")
        password = request.form.get("password")

        conn = sqlite3.connect("smartgov.db")
        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO users
                (fullname,email,password)
                VALUES(?,?,?)
                """,
                (fullname, email, password)
            )

            conn.commit()
            conn.close()

            return redirect(url_for("login"))

        except sqlite3.IntegrityError:

            conn.close()

            return render_template(
                "signup.html",
                error="Email already exists!"
            )

    return render_template("signup.html")
# ---------------- CHATBOT ----------------

@app.route("/chatbot")
def chatbot():

    if "user" not in session:
        return redirect(url_for("login"))

    return render_template(
        "chatbot.html",
        email=session["user"]
    )


# ---------------- HISTORY ----------------

@app.route("/history")
def history():

    if "user" not in session:
        return redirect(url_for("login"))

    return render_template(
        "history.html",
        email=session["user"]
    )


# ---------------- LOGOUT ----------------

@app.route("/logout")
def logout():

    session.pop("user", None)

    return redirect(url_for("login"))


# ---------------- ASK AI ----------------

@app.route("/ask", methods=["POST"])
def ask():
    if "user" not in session:
        return jsonify({"answer": "Please login first."})

    data = request.get_json()
    question = data.get("message", "")
    conversation_id = data.get("conversation_id", "")

    if not conversation_id:
        import uuid
        conversation_id = uuid.uuid4().hex

    # Load user eligibility profile details
    user_info = {
        "occupation": None,
        "age": None,
        "annual_income": None,
        "state": None
    }
    
    try:
        conn = sqlite3.connect("smartgov.db")
        cursor = conn.cursor()
        # Prioritize coordinate-based state from user_locations
        user_id = get_current_user_id()
        cursor.execute("SELECT state FROM user_locations WHERE user_id=?", (user_id,))
        loc_row = cursor.fetchone()
        p_loc_state = loc_row[0] if loc_row else None

        cursor.execute("SELECT occupation, age, annual_income, state, detected_state FROM user_profiles WHERE email=?", (session["user"],))
        profile_row = cursor.fetchone()
        conn.close()
        if profile_row:
            p_occ, p_age, p_inc, p_st, p_det = profile_row
            final_state = p_loc_state if p_loc_state else (p_st if p_st else p_det)
            user_info = {
                "occupation": p_occ,
                "age": p_age,
                "annual_income": p_inc,
                "state": final_state
            }
    except Exception as err:
        print("[SERVER LOG] Error loading user profile:", err)

    # Fetch active schemes from database with all audited fields
    schemes_data = []
    try:
        conn = sqlite3.connect("smartgov.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, category, description, state, occupation, 
                   min_age, max_age, max_income, benefits, documents_required, 
                   application_url, source, last_verified, target_groups, 
                   income_condition, other_eligibility, application_process, 
                   application_start_date, application_end_date, important_dates, 
                   official_website, source_url
            FROM schemes 
            WHERE active_status=1
        """)
        schemes_rows = cursor.fetchall()
        conn.close()
        
        for s in schemes_rows:
            (s_id, s_name, s_category, s_desc, s_state, s_occupation, min_age, max_age, max_income, benefits, docs, app_url, source, last_verified,
             target_groups, income_condition, other_eligibility, application_process,
             application_start_date, application_end_date, important_dates, official_website, source_url) = s
            schemes_data.append({
                "id": s_id,
                "name": s_name,
                "category": s_category,
                "description": s_desc,
                "state": s_state,
                "occupation": s_occupation,
                "min_age": min_age,
                "max_age": max_age,
                "max_income": max_income,
                "benefits": benefits,
                "documents_required": docs,
                "application_url": app_url,
                "source": source,
                "last_verified": last_verified,
                "target_groups": target_groups,
                "income_condition": income_condition,
                "other_eligibility": other_eligibility,
                "application_process": application_process,
                "application_start_date": application_start_date,
                "application_end_date": application_end_date,
                "important_dates": important_dates,
                "official_website": official_website,
                "source_url": source_url
            })
    except Exception as err:
        print("[SERVER LOG] Error loading schemes from database:", err)

    # Programmatically pre-calculate eligibility for each scheme
    evaluated_schemes = []
    for s in schemes_data:
        eval_res = check_eligibility(user_info, s)
        evaluated_schemes.append({
            "scheme_id": s["id"],
            "scheme_name": s["name"],
            "category": s["category"],
            "precalculated_match_status": eval_res["match_status"],
            "matched_criteria": eval_res["matched_criteria"],
            "missing_criteria": eval_res["missing_information"],
            "explanations": eval_res["explanation"]
        })

    # Fetch chat history context
    history_context = ""
    if conversation_id and conversation_id != "legacy":
        try:
            conn = sqlite3.connect("smartgov.db")
            cursor = conn.cursor()
            cursor.execute("""
                SELECT question, answer
                FROM chat_history
                WHERE email=? AND conversation_id=?
                ORDER BY id ASC
            """, (session["user"], conversation_id))
            rows = cursor.fetchall()
            conn.close()
            if rows:
                history_context = "\nCONVERSATION HISTORY:\n"
                for r_q, r_a in rows:
                    import re
                    clean_a = re.sub(r"\[OPTIONS:[^\]]+\]", "", r_a).strip()
                    history_context += f"User: {r_q}\nSmartGov AI: {clean_a}\n"
        except Exception as hist_err:
            print("[SERVER LOG] Error loading chat history context:", hist_err)

    # Construct the Gemini Prompt instructing it to return JSON
    prompt = f"""
You are SmartGov AI, an intelligent conversational government scheme discovery assistant.

You have access to pre-calculated scheme eligibility results for the user and the user's profile info.
Your task is to analyze the user's search query, look at the pre-calculated eligibility results, and decide whether to ask a follow-up question to collect missing information or provide recommendations.

USER INFO (CURRENT PROFILE):
{json.dumps(user_info, indent=2)}

PRE-CALCULATED SCHEME ELIGIBILITY:
{json.dumps(evaluated_schemes, indent=2)}

CONVERSATION HISTORY:
{history_context}

CURRENT USER QUERY:
"{question}"

RULES:
1. FIRST, analyze if the user's query is completely unrelated to government schemes, yojanas, public services, loans, pensions, startup support, or scholarships. If it is unrelated, respond with type "unrelated".
2. If the user asks a general informational question about a specific scheme (e.g., "What is PM-KISAN?", "tell me about mudra loan details"), answer it using the general scheme knowledge. Respond with type "general_response".
3. If the user is asking to find or recommend schemes:
   - Match the user's search intent to the category/name of schemes.
   - Use the pre-calculated eligibility status:
     - "high_match": User meets all criteria.
     - "needs_verification": User meets criteria but requires additional verification.
     - "potential_match" / "possible_match": Some information is missing from profile.
     - "low_match": Weak match.
     - "not_eligible": Definite mismatch.
   - Extract profile information the user provides in their current query (e.g., "I am 21" -> age=21, "Gujarat" -> state=Gujarat, "student" -> occupation=Student, "income of 90k" -> annual_income=90000) and return them in "profile_updates".
   - If crucial eligibility parameters (like state, age, occupation, or income) are missing and needed for relevant schemes, ask at most ONE clarifying question to collect the missing detail.
     - Provide 2-5 selectable options, always including "Other / I'll type my answer" and "Skip".
     - Respond with type "question".
   - If you have enough information to recommend relevant schemes, or if the user asks to "Just show me the schemes" or skips a question:
     - Return the schemes that match their search intent.
     - DO NOT invent or alter the match status! Use the pre-calculated 'precalculated_match_status' from the provided data.
     - Rank the recommendations: high matches first, then needs_verification, then potential matches.
     - DO NOT recommend schemes for which the user's precalculated_match_status is "not_eligible", unless they specifically asked about that scheme.
     - Respond with type "recommendations".

You must respond ONLY with a JSON object matching one of the following schemas:

For type "unrelated":
{{
  "type": "unrelated",
  "response": "I am SmartGov AI. I can only answer questions related to Indian Government schemes and public services."
}}

For type "general_response":
{{
  "type": "general_response",
  "response": "<helpful, accurate general answer in markdown>"
}}

For type "question":
{{
  "type": "question",
  "needs_more_information": true,
  "question": "<conversational question to ask the user>",
  "options": ["Option 1", "Option 2", "Other / I'll type my answer", "Skip"],
  "allow_custom_answer": true,
  "profile_updates": {{
    "occupation": null,
    "age": null,
    "annual_income": null,
    "state": null
  }}
}}

For type "recommendations":
{{
  "type": "recommendations",
  "understood_query": "<summarized user search intent>",
  "needs_more_information": false,
  "profile_updates": {{
    "occupation": "extracted value or null",
    "age": "extracted value or null",
    "annual_income": "extracted value or null",
    "state": "extracted value or null"
  }},
  "recommendations": [
    {{
      "scheme_id": "<id from pre-calculated eligibility, e.g. pm-kisan>",
      "scheme_name": "<name from pre-calculated eligibility>",
      "match_status": "<precalculated_match_status from data, e.g. high_match>",
      "match_score": 0-100,
      "reason": "<one sentence explaining why it matches based strictly on the pre-calculated status and explanations>"
    }}
  ]
}}
"""

    try:
        from google.genai import types
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        raw_response_text = response.text.strip()
        parsed_json = json.loads(raw_response_text)

        # Check for profile updates in the response and save to database
        profile_updates = parsed_json.get("profile_updates")
        if profile_updates:
            try:
                conn = sqlite3.connect("smartgov.db")
                cursor = conn.cursor()
                cursor.execute("SELECT occupation, age, annual_income, state, detected_state FROM user_profiles WHERE email=?", (session["user"],))
                p_row = cursor.fetchone()
                
                db_occ = p_row[0] if p_row else None
                db_age = p_row[1] if p_row else None
                db_inc = p_row[2] if p_row else None
                db_st = p_row[3] if p_row else None
                db_det = p_row[4] if p_row else None
                
                if profile_updates.get("occupation"):
                    db_occ = profile_updates["occupation"]
                if profile_updates.get("age") is not None:
                    db_age = int(profile_updates["age"])
                if profile_updates.get("annual_income") is not None:
                    db_inc = int(profile_updates["annual_income"])
                if profile_updates.get("state"):
                    db_st = profile_updates["state"]
                    
                cursor.execute("""
                    INSERT INTO user_profiles (email, occupation, age, annual_income, state, detected_state)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(email) DO UPDATE SET
                        occupation=excluded.occupation,
                        age=excluded.age,
                        annual_income=excluded.annual_income,
                        state=excluded.state,
                        detected_state=excluded.detected_state
                """, (session["user"], db_occ, db_age, db_inc, db_st, db_det))
                conn.commit()
                conn.close()
                
                # Update user_info with newly saved parameters for markdown rendering
                user_info = {
                    "occupation": db_occ,
                    "age": db_age,
                    "annual_income": db_inc,
                    "state": db_st if db_st else db_det
                }
            except Exception as profile_db_err:
                print("[SERVER LOG] Error updating profile details:", profile_db_err)

        # Process the specific response type
        resp_type = parsed_json.get("type", "general_response")
        answer = ""

        if resp_type == "unrelated" or resp_type == "general_response":
            answer = parsed_json.get("response", "I could not generate an answer.")
            
        elif resp_type == "question":
            ques_text = parsed_json.get("question", "")
            options_list = parsed_json.get("options", [])
            if options_list:
                options_str = " | ".join(options_list)
                answer = f"{ques_text}\n\n[OPTIONS: {options_str}]"
            else:
                answer = ques_text
                
        elif resp_type == "recommendations":
            recommendations_list = parsed_json.get("recommendations", [])
            
            if not recommendations_list:
                answer = "No matching scheme was found in the available scheme database."
            else:
                markdown_results = []
                
                # Fetch full factual details of matched schemes from the SQLite database
                conn = sqlite3.connect("smartgov.db")
                cursor = conn.cursor()
                
                for rec in recommendations_list:
                    s_id = rec.get("scheme_id")
                    
                    cursor.execute("""
                        SELECT id, name, category, description, state, occupation, 
                               min_age, max_age, max_income, benefits, documents_required, 
                               application_url, source, last_verified, target_groups, 
                               income_condition, other_eligibility, application_process, 
                               application_start_date, application_end_date, important_dates, 
                               official_website, source_url
                        FROM schemes 
                        WHERE id=?
                    """, (s_id,))
                    scheme_row = cursor.fetchone()
                    
                    if scheme_row:
                        (s_id, s_name, s_category, s_desc, s_state, s_occupation, 
                         min_age, max_age, max_income, benefits, docs, app_url, source, last_verified,
                         target_groups, income_condition, other_eligibility, application_process,
                         application_start_date, application_end_date, important_dates, official_website, source_url) = scheme_row
                         
                        scheme = {
                            "id": s_id,
                            "name": s_name,
                            "category": s_category,
                            "description": s_desc,
                            "state": s_state,
                            "occupation": s_occupation,
                            "min_age": min_age,
                            "max_age": max_age,
                            "max_income": max_income,
                            "benefits": benefits,
                            "documents_required": docs,
                            "application_url": app_url,
                            "source": source,
                            "last_verified": last_verified,
                            "target_groups": target_groups,
                            "income_condition": income_condition,
                            "other_eligibility": other_eligibility,
                            "application_process": application_process,
                            "application_start_date": application_start_date,
                            "application_end_date": application_end_date,
                            "important_dates": important_dates,
                            "official_website": official_website,
                            "source_url": source_url
                        }
                        
                        eval_res = check_eligibility(user_info, scheme)
                        match_status = eval_res["match_status"]
                        explanation = eval_res["explanation"]
                        
                        # Format Status Badge
                        if match_status == "high_match":
                            status_str = "🟢 HIGH MATCH"
                        elif match_status == "needs_verification":
                            status_str = "🔵 NEEDS VERIFICATION"
                        elif match_status == "potential_match" or match_status == "possible_match":
                            status_str = "🟡 POSSIBLE MATCH"
                        elif match_status == "low_match":
                            status_str = "⚪ LOW MATCH"
                        else:
                            status_str = "🔴 NOT ELIGIBLE"
                            
                        # Format Criteria values safely
                        state_val = s_state if (s_state and s_state.lower() != "all" and s_state.lower() != "all states") else "State applicability not specified"
                        if s_state == "All":
                            state_val = "All States"
                            
                        occ_val = s_occupation if (s_occupation and s_occupation.lower() != "all" and s_occupation.lower() != "no occupation restriction specified") else "No occupation restriction specified"
                        
                        has_min = min_age is not None and min_age > 0
                        has_max = max_age is not None and max_age < 120
                        if not has_min and not has_max:
                            age_val = "No specific age limit stated"
                        elif has_min and has_max:
                            age_val = f"{min_age} - {max_age} Years"
                        elif has_min:
                            age_val = f"{min_age} Years and above"
                        else:
                            age_val = f"Below {max_age} Years"
                            
                        if max_income is not None:
                            inc_val = f"Below ₹ {max_income:,}"
                        elif income_condition:
                            inc_val = income_condition
                        else:
                            inc_val = "No specific income limit stated"
                            
                        # Emoji category
                        def get_emoji(cat):
                            c = (cat or "").lower()
                            if "educat" in c or "scholar" in c: return "🎓"
                            if "farm" in c or "agri" in c: return "🌾"
                            if "women" in c or "girl" in c: return "👩"
                            if "health" in c: return "🏥"
                            if "start" in c or "business" in c: return "🚀"
                            if "pension" in c: return "👵"
                            if "loan" in c: return "💰"
                            if "hous" in c: return "🏠"
                            return "🎯"
                            
                        emoji = get_emoji(s_category)
                        
                        # Formulate lists
                        dates_val = important_dates if important_dates else "No fixed application deadline specified."
                        process_val = application_process if application_process else "Please consult the official department or portal for the detailed application steps."
                        
                        if docs:
                            docs_list = "\n".join([f"- {d.strip()}" for d in docs.split(",") if d.strip()])
                        else:
                            docs_list = "- Required documents should be confirmed with the official department."
                            
                        links_lines = []
                        if official_website:
                            links_lines.append(f"- **Official Website:** [{official_website}]({official_website})")
                        if app_url:
                            links_lines.append(f"- **Apply Online / Application Portal:** [{app_url}]({app_url})")
                        links_val = "\n".join(links_lines) if links_lines else "- No verified official link available."
                        
                        other_block = f"\n- **Other Conditions:** {other_eligibility}" if other_eligibility else ""
                        
                        scheme_markdown = f"""### {emoji} {s_name}
**Category:** {s_category}
**Match Status:** {status_str}

#### 1. ABOUT THE SCHEME
{s_desc}

#### 2. WHY THIS SCHEME MATCHES YOU
Your profile status:
- Occupation: {user_info.get('occupation') or '✕ Not provided'}
- Age: {f"{user_info.get('age')} Years" if user_info.get('age') is not None else '✕ Not provided'}
- Annual Income: {f"₹ {user_info.get('annual_income'):,}" if user_info.get('annual_income') is not None else '✕ Not provided'}
- State: {user_info.get('state') or '✕ Not provided'}

Assessment Checklist:
{"\n".join([f"- {exp}" for exp in explanation])}

#### 3. ELIGIBILITY / SCHEME CRITERIA
- **State:** {state_val}
- **Occupation:** {occ_val}
- **Age Limit:** {age_val}
- **Income Limit:** {inc_val}{other_block}

#### 4. BENEFITS
{benefits}

#### 5. REQUIRED DOCUMENTS
{docs_list}

#### 6. APPLICATION PROCESS
{process_val}

#### 7. 📅 IMPORTANT DATES
{dates_val}

#### 8. 🔗 OFFICIAL LINKS
{links_val}

#### 9. SOURCE DEPARTMENT
- **Department/Source:** {source}

#### 10. LAST VERIFIED
- **Last Verified Date:** {last_verified}
"""
                        markdown_results.append(scheme_markdown.strip())
                        
                conn.close()
                
                if markdown_results:
                    disclaimer = "\n\nYour match is based on the information currently available in your SmartGov AI profile and the scheme eligibility data. Final eligibility and approval are determined by the respective government authority."
                    answer = "\n\n---\n\n".join(markdown_results) + disclaimer
                else:
                    answer = "No matching scheme was found in the available scheme database."

        # Save conversation to chat history
        conn = sqlite3.connect("smartgov.db")
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_history
            (email, question, answer, conversation_id)
            VALUES (?, ?, ?, ?)
        """, (
            session["user"],
            question,
            answer,
            conversation_id
        ))
        conn.commit()
        conn.close()

        return jsonify({
            "answer": answer,
            "conversation_id": conversation_id
        })

    except Exception as e:
        print("[SERVER LOG] Exception occurred in /ask:", e)
        import traceback
        traceback.print_exc()
        return jsonify({
            "answer": f"An error occurred: {str(e)}"
        })


# ---------------- CONVERSATIONS API ----------------

@app.route("/api/conversations", methods=["GET"])
def get_conversations():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()

    # Query to fetch the first user message for each conversation to serve as title
    cursor.execute("""
        SELECT h.conversation_id, h.question, h.created_at
        FROM chat_history h
        INNER JOIN (
            SELECT conversation_id, MIN(id) as first_id
            FROM chat_history
            WHERE email=? AND conversation_id IS NOT NULL AND conversation_id != ''
            GROUP BY conversation_id
        ) first_msg ON h.id = first_msg.first_id
        ORDER BY h.id DESC
    """, (session["user"],))

    rows = cursor.fetchall()
    conn.close()

    conversations = []
    for r in rows:
        conversations.append({
            "id": r[0],
            "title": r[1][:60] + "..." if len(r[1]) > 60 else r[1],
            "created_at": r[2]
        })

    return jsonify(conversations)


@app.route("/api/conversations/<conversation_id>", methods=["GET"])
def get_conversation_messages(conversation_id):
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()

    # Query all messages within the specified conversation belonging to the authenticated user
    cursor.execute("""
        SELECT question, answer, id
        FROM chat_history
        WHERE email=? AND conversation_id=?
        ORDER BY id ASC
    """, (session["user"], conversation_id))

    rows = cursor.fetchall()
    conn.close()

    messages = []
    for r in rows:
        messages.append({
            "id": f"q-{r[2]}",
            "role": "user",
            "text": r[0]
        })
        messages.append({
            "id": f"a-{r[2]}",
            "role": "assistant",
            "text": r[1]
        })

    return jsonify(messages)


@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()

    # Secure deletion scoped strictly to the currently authenticated user
    cursor.execute("""
        DELETE FROM chat_history
        WHERE email=? AND conversation_id=?
    """, (session["user"], conversation_id))

    conn.commit()
    conn.close()

    return jsonify({"success": True})


# ---------------- RECOMMEND PAGE & APIs ----------------

@app.route("/recommend")
def recommend():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("recommend.html", email=session["user"])


@app.route("/api/user/profile", methods=["GET"])
def get_user_profile():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()
    cursor.execute("SELECT occupation, age, annual_income, state, detected_state FROM user_profiles WHERE email=?", (session["user"],))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({
            "occupation": row[0],
            "age": row[1],
            "annual_income": row[2],
            "state": row[3],
            "detected_state": row[4]
        })
    else:
        return jsonify({})


@app.route("/api/user/profile", methods=["POST"])
def save_user_profile():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    occupation = data.get("occupation")
    age = data.get("age")
    annual_income = data.get("annual_income")
    state = data.get("state")
    detected_state = data.get("detected_state")

    try:
        if age is not None and age != "":
            age = int(age)
        else:
            age = None
    except ValueError:
        age = None

    try:
        if annual_income is not None and annual_income != "":
            annual_income = int(annual_income)
        else:
            annual_income = None
    except ValueError:
        annual_income = None

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_profiles (email, occupation, age, annual_income, state, detected_state)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            occupation=excluded.occupation,
            age=excluded.age,
            annual_income=excluded.annual_income,
            state=excluded.state,
            detected_state=CASE WHEN excluded.detected_state IS NOT NULL THEN excluded.detected_state ELSE user_profiles.detected_state END
    """, (session["user"], occupation, age, annual_income, state, detected_state))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Profile saved successfully."})


@app.route("/api/user/save-detected-state", methods=["POST"])
def save_detected_state():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    detected_state = data.get("detected_state")

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_profiles (email, detected_state)
        VALUES (?, ?)
        ON CONFLICT(email) DO UPDATE SET
            detected_state=excluded.detected_state
    """, (session["user"], detected_state))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Detected state saved successfully."})


def get_current_user_id():
    if "user" not in session:
        return None
    user_id = session.get("user_id")
    if not user_id:
        conn = sqlite3.connect("smartgov.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email=?", (session["user"],))
        row = cursor.fetchone()
        conn.close()
        if row:
            session["user_id"] = row[0]
            user_id = row[0]
    return user_id


@app.route("/api/user/save-location", methods=["POST"])
def save_location():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    accuracy = data.get("accuracy")
    state = data.get("state")
    district = data.get("district")
    city = data.get("city")
    country = data.get("country")
    location_source = data.get("location_source", "browser_geolocation")

    # Server-side geocoding debug logs
    print(f"[LOCATION DEBUG] Saving location coordinates:")
    print(f"  Current user ID: {user_id}")
    print(f"  GPS latitude: {latitude}")
    print(f"  GPS longitude: {longitude}")
    print(f"  GPS accuracy: {accuracy}")
    print(f"  Detected country: {country}")
    print(f"  Detected state: {state}")
    print(f"  Detected district: {district}")
    print(f"  Detected city: {city}")
    print(f"  Location source: {location_source}")

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_locations (user_id, latitude, longitude, accuracy, state, district, city, country, location_source, location_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            accuracy=excluded.accuracy,
            state=excluded.state,
            district=excluded.district,
            city=excluded.city,
            country=excluded.country,
            location_source=excluded.location_source,
            location_updated_at=CURRENT_TIMESTAMP
    """, (user_id, latitude, longitude, accuracy, state, district, city, country, location_source))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Location details saved successfully."})


@app.route("/api/user/location", methods=["GET"])
def get_location():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT latitude, longitude, accuracy, state, district, city, country, location_source, location_updated_at
        FROM user_locations
        WHERE user_id=?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        lat, lon, acc, state, dist, city, country, src, updated_at = row
        return jsonify({
            "success": True,
            "latitude": lat,
            "longitude": lon,
            "accuracy": acc,
            "state": state,
            "district": dist,
            "city": city,
            "country": country,
            "location_source": src,
            "location_updated_at": updated_at
        })
    else:
        return jsonify({"success": False, "message": "No location saved."})


@app.route("/api/schemes/recommend", methods=["POST"])
def recommend_schemes():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    occupation = data.get("occupation")
    age = data.get("age")
    annual_income = data.get("annual_income")
    state = data.get("state")
    detected_state = data.get("detected_state")

    # Force numeric type validation
    try:
        if age is not None:
            age = int(age)
    except ValueError:
        age = None

    try:
        if annual_income is not None:
            annual_income = int(annual_income)
    except ValueError:
        annual_income = None

    # Save user profile parameters for persistence
    conn = sqlite3.connect("smartgov.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_profiles (email, occupation, age, annual_income, state, detected_state)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            occupation=excluded.occupation,
            age=excluded.age,
            annual_income=excluded.annual_income,
            state=CASE WHEN excluded.state IS NOT NULL THEN excluded.state ELSE user_profiles.state END,
            detected_state=CASE WHEN excluded.detected_state IS NOT NULL THEN excluded.detected_state ELSE user_profiles.detected_state END
    """, (session["user"], occupation, age, annual_income, state, detected_state))
    conn.commit()

    # Load effective state for recommendations check (prioritize user_locations table)
    user_id = get_current_user_id()
    cursor.execute("SELECT state FROM user_locations WHERE user_id=?", (user_id,))
    loc_row = cursor.fetchone()
    effective_state = loc_row[0] if loc_row else None

    if not effective_state:
        cursor.execute("SELECT state, detected_state FROM user_profiles WHERE email=?", (session["user"],))
        p_row = cursor.fetchone()
        db_state, db_detected = p_row if p_row else (None, None)
        effective_state = db_state if db_state else db_detected

    # Query all active schemes with all new structured fields
    cursor.execute("""
        SELECT id, name, category, description, state, occupation, 
               min_age, max_age, max_income, benefits, documents_required, 
               application_url, source, last_verified, target_groups, 
               income_condition, other_eligibility, application_process, 
               application_start_date, application_end_date, important_dates, 
               official_website, source_url
        FROM schemes 
        WHERE active_status=1
    """)
    rows = cursor.fetchall()
    conn.close()

    results = []
    user_profile = {
        "occupation": occupation,
        "age": age,
        "annual_income": annual_income,
        "state": effective_state
    }

    for r in rows:
        (s_id, s_name, s_category, s_desc, s_state, s_occupation, 
         min_age, max_age, max_income, benefits, docs, app_url, source, last_verified,
         target_groups, income_condition, other_eligibility, application_process,
         application_start_date, application_end_date, important_dates, official_website, source_url) = r
         
        scheme = {
            "id": s_id,
            "name": s_name,
            "category": s_category,
            "description": s_desc,
            "state": s_state,
            "occupation": s_occupation,
            "min_age": min_age,
            "max_age": max_age,
            "max_income": max_income,
            "benefits": benefits,
            "documents_required": docs,
            "application_url": app_url,
            "source": source,
            "last_verified": last_verified,
            "target_groups": target_groups,
            "income_condition": income_condition,
            "other_eligibility": other_eligibility,
            "application_process": application_process,
            "application_start_date": application_start_date,
            "application_end_date": application_end_date,
            "important_dates": important_dates,
            "official_website": official_website,
            "source_url": source_url
        }
        
        eval_res = check_eligibility(user_profile, scheme)
        
        results.append({
            "scheme_id": s_id,
            "scheme_name": s_name,
            "category": s_category,
            "description": s_desc,
            "match_status": eval_res["match_status"],
            "matched_criteria": eval_res["matched_criteria"],
            "missing_information": eval_res["missing_information"],
            "benefits": benefits,
            "documents_required": docs,
            "application_url": app_url,
            "source": source,
            "last_verified": last_verified,
            "explanation": eval_res["explanation"],
            "target_groups": target_groups,
            "income_condition": income_condition,
            "other_eligibility": other_eligibility,
            "application_process": application_process,
            "application_start_date": application_start_date,
            "application_end_date": application_end_date,
            "important_dates": important_dates,
            "official_website": official_website,
            "source_url": source_url,
            "min_age": min_age,
            "max_age": max_age,
            "max_income": max_income,
            "state": s_state,
            "occupation": s_occupation
        })

    # Sort results deterministically
    def sort_rank(item):
        status = item["match_status"]
        if status == "high_match":
            score = 0
        elif status == "needs_verification":
            score = 1
        elif status == "potential_match" or status == "possible_match":
            score = 2
        elif status == "low_match":
            score = 3
        else:
            score = 4
        return (score, -len(item.get("matched_criteria", [])), len(item.get("missing_information", [])))

    results.sort(key=sort_rank)

    return jsonify({
        "success": True,
        "results": results
    })


@app.route("/api/schemes/explain", methods=["POST"])
def explain_scheme():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    name = data.get("name", "")
    description = data.get("description", "")
    question = data.get("question")

    if question:
        prompt = f"""
You are SmartGov AI, an intelligent conversational scheme discovery assistant.
The user is asking a follow-up question about the government scheme: {name}.
Here is the official details/description of the scheme:
{description}

User's Question:
"{question}"

Please provide a helpful, accurate, and encouraging answer to this question based on the scheme details.
If the answer is not supported by the scheme details or is ambiguous, reply honestly and do not invent any criteria or requirements.
Format your response in clean markdown.
"""
    else:
        prompt = f"""
You are SmartGov AI.
Explain the following government scheme in detail, highlighting:
1. What it is and who benefits
2. Eligibility requirements
3. Key documents needed to apply
4. Steps to apply

Scheme Name: {name}
Description: {description}

Provide a clean, encouraging response formatted in markdown. Keep it concise but comprehensive.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )
        return jsonify({"explanation": response.text})
    except Exception as e:
        print(e)
        return jsonify({"explanation": f"Failed to generate AI explanation: {str(e)}"})


# ---------------- RUN APP ----------------

if __name__ == "__main__":

    app.run(debug=True)