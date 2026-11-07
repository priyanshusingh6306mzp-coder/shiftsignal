# app/database/init_db.py
import sqlite3
import os

# 1. Define exact paths based on where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "shiftsignal.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")

def initialize_database():
    print("=======================================================")
    print("SHIFTSIGNAL - DATABASE INITIALIZATION")
    print("=======================================================")
    print(f"Creating/Connecting to database at:\n{DB_PATH}")
    
    # 2. Read the SQL commands from our schema file
    if not os.path.exists(SCHEMA_PATH):
        print(f"Error: Schema file not found at {SCHEMA_PATH}")
        return

    with open(SCHEMA_PATH, 'r') as file:
        schema_script = file.read()
        
    # 3. Connect to SQLite and execute the script
    # The 'with' statement automatically commits transactions and closes the connection
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # executescript() is used because we have multiple CREATE TABLE statements
        cursor.executescript(schema_script)
        
        print("\nSUCCESS: Database schema successfully applied!")
        print("Tables created: machines, anomalies, issues")
        print("=======================================================")

if __name__ == "__main__":
    initialize_database()