# app/database/populate_db.py
import sqlite3
import pandas as pd
import os

# 1. Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR)) # Goes up to shiftsignal/
DB_PATH = os.path.join(BASE_DIR, "shiftsignal.db")

MACHINES_CSV = os.path.join(PROJECT_ROOT, "data", "generated", "machines.csv")
ANOMALIES_CSV = os.path.join(PROJECT_ROOT, "data", "generated", "zscore_anomalies.csv")

def populate_database():
    print("=======================================================")
    print("SHIFTSIGNAL - DATABASE POPULATION")
    print("=======================================================")
    
    if not os.path.exists(MACHINES_CSV) or not os.path.exists(ANOMALIES_CSV):
        print("Error: Could not find the generated CSV files.")
        print(f"Looked for: \n{MACHINES_CSV}\n{ANOMALIES_CSV}")
        return

    # 2. Read the CSVs
    print("Loading CSV data...")
    machines_df = pd.read_csv(MACHINES_CSV)
    anomalies_df = pd.read_csv(ANOMALIES_CSV)
    
    # We don't want to insert NaN values as 'nan' strings in the database, 
    # so we fill them with empty strings just in case.
    anomalies_df = anomalies_df.fillna("")

    # 3. Connect to SQLite
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # --- POPULATE MACHINES ---
        print("Inserting machines...")
        # Clear existing to prevent Primary Key errors if run multiple times
        cursor.execute("DELETE FROM machines") 
        
        for _, row in machines_df.iterrows():
            cursor.execute(
                """
                INSERT INTO machines (machine_id, production_line, baseline_output)
                VALUES (?, ?, ?)
                """,
                (row['machine_id'], row['line_id'], row['baseline_output'])
            )
            
        # --- POPULATE ANOMALIES & AUTO-CREATE ISSUES ---
        print(f"Inserting {len(anomalies_df)} anomalies and creating issues...")
        cursor.execute("DELETE FROM issues")
        cursor.execute("DELETE FROM anomalies")
        
        for _, row in anomalies_df.iterrows():
            # We assume your evaluation script generated a 'z_score' or similar metric. 
            # If the column name is different, we can adjust this. 
            # We'll use a placeholder severity for now if a strict z-score column isn't present.
            # We also need a descriptive 'anomaly_type'. Let's see what your dataframe has.
            
            # Using basic defaults just to get the data inserted safely. 
            # We can refine the 'evidence' string later based on your specific columns.
            record_id = row['record_id']
            machine_id = row['machine_id']
            date = row['date']
            shift = row['shift']
            
            # Insert the Anomaly
            cursor.execute(
                """
                INSERT INTO anomalies (record_id, machine_id, date, shift, anomaly_type, severity_score, evidence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (record_id, machine_id, date, shift, 'statistical_anomaly', 1.0, 'Flagged by Robust Z-Score')
            )
            
            # Get the ID of the anomaly we just inserted
            new_anomaly_id = cursor.lastrowid
            
            # Create an OPEN Issue linked to this anomaly
            cursor.execute(
                """
                INSERT INTO issues (anomaly_id, machine_id, status)
                VALUES (?, ?, 'OPEN')
                """,
                (new_anomaly_id, machine_id)
            )

        print("\nSUCCESS: Database populated successfully!")
        print("=======================================================")

if __name__ == "__main__":
    populate_database()