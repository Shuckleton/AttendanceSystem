import mysql.connector
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory,send_file
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import pandas as pd
import hashlib
import os
import secrets
import qrcode
from flask_socketio import SocketIO, emit



app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # Or use a fixed string for simplicity

socketio = SocketIO(app)

db_config = {
    'user': 'root',  # default MySQL username for XAMPP
    'password': '',  # default MySQL password for XAMPP is empty
    'host': 'localhost',
    'database': 'user_auth'
}



def get_db_connection():
    return mysql.connector.connect(**db_config)

def generate_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

def check_password_hash(stored_password, provided_password):
    return stored_password == hashlib.sha256(provided_password.encode()).hexdigest()

def fetch_records_from_database(date=None, employee=None):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Base query
        query = "SELECT e.first_name, e.last_name, e.designation, a.status, a.time_in, a.time_out FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE 1=1"
        params = []

        # Filter by date if provided
        if date:
            query += " AND a.date = %s"
            params.append(date)

        # Filter by employee name if provided
        if employee:
            query += " AND (e.first_name LIKE %s OR e.last_name LIKE %s)"
            params.extend([f"%{employee}%", f"%{employee}%"])

        # Execute the query
        cursor.execute(query, params)
        records = cursor.fetchall()

        # Convert any timedelta or datetime objects to string
        for record in records:
            if isinstance(record.get('time_in'), timedelta):
                record['time_in'] = str(record['time_in'])  # Convert to string
            if isinstance(record.get('time_out'), timedelta):
                record['time_out'] = str(record['time_out'])  # Convert to string

        return records

    except Exception as e:
        print(f"Error fetching records: {e}")
        return []
    
    finally:
        cursor.close()
        conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    # Fetch user role from session or database
    user_role = session.get('user_role', 'staff')  # Default to 'staff'
    return render_template('attendance.html', user_role=user_role)


@app.route('/signup', methods=['POST'])
def signup():
    first_name = request.form['first_name']
    last_name = request.form['last_name']
    dob = request.form['dob']
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    confirm_password = request.form['confirm_password']

    # Password confirmation check
    if password != confirm_password:
        flash('Passwords do not match!', 'error')
        return redirect(url_for('index'))

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if the email already exists
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        flash('Email already exists!', 'error')
        cursor.close()
        conn.close()
        return redirect(url_for('index'))

    hashed_password = generate_password_hash(password)

    # Insert user with default role as 'staff'
    cursor.execute("""
        INSERT INTO users (first_name, last_name, dob, username, email, password, role)
        VALUES (%s, %s, %s, %s, %s, %s, 'staff')
    """, (first_name, last_name, dob, username, email, hashed_password))
    
    conn.commit()
    cursor.close()
    conn.close()
    flash('Account created successfully! Please log in.', 'success')
    return redirect(url_for('index'))

@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        flash('Email not found!', 'error')
        return redirect(url_for('index'))

    if check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['user_role'] = user['role']  # Set user role in session
        flash('Logged in successfully!', 'success')
        
        # Redirect to dashboard or any other page
        return redirect(url_for('dashboard'))
    else:
        flash('Invalid password!', 'error')
        return redirect(url_for('index'))


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    flash('Logged out successfully!', 'success')
    return redirect(url_for('index'))

@app.route('/attendance')
def attendance():
    if 'user_id' not in session:
        flash('Please log in to access the attendance system.', 'error')
        return redirect(url_for('index'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employees")
    employees = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template('attendance.html', employees=employees)

# QR code directory
qr_codes_dir = os.path.join(app.static_folder, 'qr_codes')

if not os.path.exists(qr_codes_dir):
    os.makedirs(qr_codes_dir)

# ID picture directory
id_pictures_dir = os.path.join(app.static_folder, 'id_pictures')

if not os.path.exists(id_pictures_dir):
    os.makedirs(id_pictures_dir)

@app.route('/add_employee', methods=['POST'])
def add_employee():
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    designation = request.form.get('designation')
    deployment_area = request.form.get('deployment_area')
    unit_type = request.form.get('unit_type')  # Get unit_type from the form

    # Handle ID picture upload
    id_picture = request.files.get('id_picture')
    id_picture_filename = None
    if id_picture:
        id_picture_filename = f"{first_name}_{last_name}.jpg"
        id_picture.save(os.path.join(id_pictures_dir, id_picture_filename))

    # Generate employee ID and QR code data
    employee_id = f"CL-{str(len(os.listdir(qr_codes_dir)) + 1).zfill(4)}"
    qr_data = f"Employee ID: {employee_id}, Name: {first_name} {last_name}, Unit Type: {unit_type}"  # Include unit_type in QR code data

    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')

    # Save QR code image
    qr_code_path = os.path.join(qr_codes_dir, f"{employee_id}.png")
    img.save(qr_code_path)

    # Create the URL to access the QR code
    qr_code_url = url_for('get_qr_code', filename=f"{employee_id}.png", _external=True)

    # Save employee details to the database
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO employees (first_name, last_name, designation, status, deployment_area, unit_type, id_picture, qr_code_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (first_name, last_name, designation, 'Absent', deployment_area, unit_type, id_picture_filename, qr_data))  # Save unit_type and qr_data

        conn.commit()
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'An error occurred while adding the employee to the database.',
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({
        'success': True,
        'employee_id': employee_id,
        'qr_code_url': qr_code_url,
        'id_picture_filename': id_picture_filename,  # Filename of the ID picture
        'message': 'Employee added successfully!'
    })

@app.route('/get_employees', methods=['GET'])
def get_employees():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Retrieve filter parameters from query string
        status = request.args.get('status', '')
        unit_type = request.args.get('unit_type', '')
        deployment_area = request.args.get('deployment_area', '')

        # Build base query
        query = "SELECT * FROM employees WHERE 1=1"
        params = []

        # Append filters to the query
        if status:
            query += " AND status = %s"
            params.append(status)
        if unit_type:
            query += " AND unit_type = %s"
            params.append(unit_type)
        if deployment_area:
            query += " AND deployment_area = %s"
            params.append(deployment_area)

        # Execute the query with filters
        cursor.execute(query, params)
        employees = cursor.fetchall()

        # Convert datetime and timedelta fields to strings
        for employee in employees:
            for key in ['time_in', 'time_out', 'last_updated']:
                value = employee.get(key)
                if isinstance(value, datetime):
                    employee[key] = value.isoformat()  # Convert datetime to ISO format string
                elif isinstance(value, timedelta):
                    employee[key] = str(value)  # Convert timedelta to string
                else:
                    employee[key] = None  # Handle None values

        return jsonify(employees), 200  # Return employees with a 200 OK status
    except Exception as e:
        # Log the error (optional)
        print(f"Error fetching employees: {e}")
        return jsonify({"error": "Failed to fetch employees"}), 500  # Return an error response
    finally:
        # Ensure resources are cleaned up
        cursor.close()
        conn.close()



@app.route('/qr_codes/<filename>')
def get_qr_code(filename):
    return send_from_directory(qr_codes_dir, filename)

@app.route('/id_pictures/<filename>')
def get_id_picture(filename):
    return send_from_directory(id_pictures_dir, filename)


@app.route('/fetch-real-time-stats', methods=['GET'])
def fetch_real_time_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Example queries to get real-time stats
        cursor.execute("SELECT COUNT(*) as total_employees FROM employees")
        total_employees = cursor.fetchone()['total_employees']

        cursor.execute("SELECT COUNT(*) as present FROM employees WHERE status = 'Present'")
        total_present = cursor.fetchone()['present']

        cursor.execute("SELECT COUNT(*) as absent FROM employees WHERE status = 'Absent'")
        total_absent = cursor.fetchone()['absent']

        # You can add more queries for additional stats as needed

        stats = [
            {'title': 'Total Employees', 'value': total_employees},
            {'title': 'Total Present', 'value': total_present},
            {'title': 'Total Absent', 'value': total_absent},
            # Add other stats here
        ]

        return jsonify(stats), 200  # Return the stats with a 200 OK status
    except Exception as e:
        print(f"Error fetching real-time stats: {e}")
        return jsonify({"error": "Failed to fetch real-time stats"}), 500  # Return an error response
    finally:
        cursor.close()
        conn.close()
@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    qr_code_data = request.json['qr_code_data']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check if the employee exists
    cursor.execute("SELECT * FROM employees WHERE qr_code_data = %s", (qr_code_data,))
    employee = cursor.fetchone()

    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found.'}), 404

    # Get the current time
    current_time = datetime.now()

    # If the status is 'Absent', set it to 'Active' and record time_in
    if employee['status'] == 'Absent':
        cursor.execute("UPDATE employees SET status = 'Active', last_updated = %s WHERE id = %s", 
                       (current_time, employee['id']))
        
        # Insert into attendance table
        cursor.execute("INSERT INTO attendance (employee_id, status, time_in, date) VALUES (%s, 'Active', %s, %s)", 
                       (employee['id'], current_time, current_time.date()))
        conn.commit()
        return jsonify({'success': True, 'message': 'Attendance marked as Active.'})

    # If the status is already 'Active', check if it's time to log time_out
    elif employee['status'] == 'Active':
        # Set a default time threshold (5 PM)
        time_threshold = current_time.replace(hour=17, minute=0, second=0)

        if current_time >= time_threshold:
            cursor.execute("UPDATE employees SET status = 'Absent', last_updated = %s WHERE id = %s",
                           (current_time, employee['id']))
            cursor.execute("UPDATE attendance SET time_out = %s WHERE employee_id = %s AND date = %s AND time_out IS NULL",
                           (current_time, employee['id'], current_time.date()))
            conn.commit()
            return jsonify({'success': True, 'message': 'Attendance marked as Absent, time out recorded.'})
        else:
            return jsonify({'success': False, 'message': 'Cannot mark time out before 5 PM.'})

    return jsonify({'success': False, 'message': 'Invalid status.'}), 400

from datetime import datetime, timedelta

@app.route('/get_attendance_records', methods=['POST'])
def get_attendance_records():
    employee_id = request.json['employee']
    date = request.json['date']

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch attendance records with employee names
    cursor.execute("""
        SELECT a.*, e.first_name, e.last_name, e.designation 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = %s AND a.date = %s
    """, (employee_id, date))

    records = cursor.fetchall()
    print(f"Received employee_id: {employee_id}, date: {date}")
    print(f"Fetched records: {records}")

    # Convert datetime objects to string for JSON serialization
    for record in records:
        if isinstance(record['time_in'], datetime):
            record['time_in'] = record['time_in'].isoformat()  # Convert to ISO format string
        if isinstance(record['time_out'], datetime):
            record['time_out'] = record['time_out'].isoformat()  # Convert to ISO format string

        # Convert any timedelta fields to string if they exist
        for key in record:
            if isinstance(record[key], timedelta):
                record[key] = str(record[key])  # Convert timedelta to string

    return jsonify({'records': records})


@app.route('/export_attendance_records', methods=['POST'])
def export_attendance():
    employee_id = request.json['employee']
    date = request.json['date']

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch attendance records
    cursor.execute("""
        SELECT a.*, e.first_name, e.last_name, e.designation 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = %s AND a.date = %s
    """, (employee_id, date))

    records = cursor.fetchall()

    # Create a DataFrame from the records
    df = pd.DataFrame(records)

    # Save the DataFrame to an Excel file
    file_path = 'attendance_records.xlsx'
    df.to_excel(file_path, index=False)

    # Send the file back to the client
    return send_file(file_path, as_attachment=True)




def reset_employee_status():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    today = datetime.now().date()

    try:
        # Reset status for employees who do not have an attendance record for today
        cursor.execute("""
            UPDATE employees e
            LEFT JOIN (
                SELECT employee_id FROM attendance WHERE date = %s
            ) a ON e.id = a.employee_id
            SET e.status = 'Absent'
            WHERE a.employee_id IS NULL
        """, (today,))

        conn.commit()
        print("Employee statuses have been reset based on today's attendance records.")
        message = "Employee statuses have been reset based on today's attendance records."

        # Emit notification to all connected clients
        socketio.emit('notification', {'message': message})

    except Exception as e:
        print(f"Error resetting employee status: {e}")

    finally:
        cursor.close()
        conn.close()

@app.route('/create_task', methods=['POST'])
def create_task():
    task_name = request.form.get('task_name')
    description = request.form.get('description')
    employee_id = request.form.get('employee_id')
    start_schedule = request.form.get('start_schedule')
    end_schedule = request.form.get('end_schedule')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the employee is absent
        cursor.execute('SELECT status, unit_type FROM employees WHERE id = %s', (employee_id,))
        result = cursor.fetchone()
        
        if result is None or result[0] == 'absent':
            return jsonify({'status': 'error', 'message': 'Cannot assign task to an absent employee.'})
        
        if result[1] == 'Motorcycle Unit':
            # Insert task
            cursor.execute('''
                INSERT INTO tasks (task_name, description, employee_id, start_schedule, end_schedule)
                VALUES (%s, %s, %s, %s, %s)
            ''', (task_name, description, employee_id, start_schedule, end_schedule))
            conn.commit()
            
            # Update employee status to VIP Escort
            cursor.execute('UPDATE employees SET unit_type = %s WHERE id = %s', ('VIP Escort', employee_id))
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({'status': 'success', 'message': 'Task created and employee assigned as VIP Escort!'})
        else:
            return jsonify({'status': 'error', 'message': 'Employee is not a Motorcycle Unit.'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})



@app.route('/search_employees')
def search_employees():
    query = request.args.get('query', '')
    unit_type = request.args.get('unit_type', '')
    status = request.args.get('status', '')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Modify the SQL query to match the correct unit_type and status
    cursor.execute('''
        SELECT id, first_name, last_name
        FROM employees
        WHERE CONCAT(first_name, ' ', last_name) LIKE %s
        AND unit_type = %s
        AND status = %s
        LIMIT 10
    ''', (f'%{query}%', unit_type, status))
    
    employees = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if not employees:
        return jsonify([{'label': 'No active motorcycle units at the moment', 'value': ''}])
    
    return jsonify(employees)

@app.route('/search_employee', methods=['GET'])
def search_employee():
    query = request.args.get('query')
    if not query:
        return jsonify({'success': False, 'message': 'Query is required.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Search for employee by name or ID
        cursor.execute('''
            SELECT * FROM employees
            WHERE CONCAT(first_name, ' ', last_name) LIKE %s OR id = %s
        ''', (f'%{query}%', query))

        employee = cursor.fetchone()

        if employee:
            return jsonify({'success': True, 'employee': employee})
        else:
            return jsonify({'success': False, 'message': 'Employee not found.'})
    
    except Exception as e:
        print(f"Error searching for employee: {e}")
        return jsonify({'success': False, 'message': 'An error occurred while searching for the employee.'}), 500
    
    finally:
        cursor.close()
        conn.close()



@app.route('/get_tasks', methods=['GET'])
def get_tasks():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM tasks
        """)
        tasks = cursor.fetchall()

        return jsonify(tasks), 200
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        return jsonify({"error": "Failed to fetch tasks"}), 500
    finally:
        cursor.close()
        conn.close()

def revert_unit_types():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    now = datetime.now()

    try:
        # Fetch tasks where end_schedule is less than the current time and status is 'Pending'
        cursor.execute('''
            SELECT employee_id
            FROM tasks
            WHERE end_schedule < %s AND status = 'Pending'
        ''', (now,))
        tasks_to_revert = cursor.fetchall()

        if tasks_to_revert:
            # Update unit type back to 'Motorcycle Unit'
            cursor.execute('''
                UPDATE employees
                SET unit_type = 'Motorcycle Unit'
                WHERE id IN (%s)
            ''' % ','.join(str(task['employee_id']) for task in tasks_to_revert))

            conn.commit()
            message = "Unit types have been reverted based on task schedules."

            # Emit notification to all connected clients
            socketio.emit('notification', {'message': message})

            print(message)
    except Exception as e:
        print(f"Error reverting unit types: {e}")
    finally:
        cursor.close()
        conn.close()


@app.route('/get_deployment_areas', methods=['GET'])
def get_deployment_areas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch distinct deployment areas from the database
        cursor.execute("SELECT DISTINCT deployment_area FROM employees")
        areas = cursor.fetchall()

        # Extract the deployment areas
        deployment_areas = [area['deployment_area'] for area in areas]

        return jsonify(deployment_areas), 200  # Return areas with a 200 OK status
    except Exception as e:
        # Log the error (optional)
        print(f"Error fetching deployment areas: {e}")
        return jsonify({"error": "Failed to fetch deployment areas"}), 500  # Return an error response
    finally:
        # Ensure resources are cleaned up
        cursor.close()
        conn.close()

@app.route('/some_endpoint', methods=['POST'])
def some_endpoint():
    # Your logic here
    response = {'status': 'success', 'message': 'Task created successfully!'}
    return jsonify(response)

@app.route('/edit_employee', methods=['POST'])
def edit_employee():
    employee_id = request.form.get('employee_id')
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    designation = request.form.get('designation')
    deployment_area = request.form.get('deployment_area')
    unit_type = request.form.get('unit_type')

    if not employee_id:
        return jsonify({'success': False, 'message': 'Employee ID is required.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update employee details
        cursor.execute('''
            UPDATE employees
            SET first_name = %s, last_name = %s, designation = %s, deployment_area = %s, unit_type = %s
            WHERE id = %s
        ''', (first_name, last_name, designation, deployment_area, unit_type, employee_id))

        conn.commit()

        return jsonify({'success': True, 'message': 'Employee information updated successfully!'})
    
    except Exception as e:
        print(f"Error updating employee information: {e}")
        return jsonify({'success': False, 'message': 'An error occurred while updating employee information.'}), 500
    
    finally:
        cursor.close()
        conn.close()



if __name__ == '__main__':
    # Initialize and start the scheduler
    scheduler = BackgroundScheduler()
    
    # Schedule the reset_employee_status function to run every minute
    scheduler.add_job(func=revert_unit_types, trigger="interval", minutes=1)
    
    # Start the scheduler
    scheduler.start()

    # Call the reset function at server startup
    reset_employee_status()

    try:
        socketio.run(app, debug=True)
    finally:
        # Shut down the scheduler when exiting the app
        scheduler.shutdown()