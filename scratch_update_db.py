import sqlite3
import requests
import json
import os
import time

db_path = r'D:\Codes\GymX\mobile_app\assets\gymx.db'

all_exercises = []
cursor_val = ""

while True:
    print(f"Fetching after {cursor_val}...")
    url = f'https://oss.exercisedb.dev/api/v1/exercises?limit=50'
    if cursor_val:
        url += f'&after={cursor_val}'
        
    r = requests.get(url)
    if r.status_code == 200:
        res = r.json()
        data = res.get('data', [])
        
        all_exercises.extend(data)
        print(f"Added {len(data)} exercises. Total: {len(all_exercises)}")
        
        meta = res.get('meta', {})
        if meta.get('hasNextPage'):
            cursor_val = meta.get('nextCursor')
            time.sleep(1) # Be nice to the API
        else:
            break
    elif r.status_code == 429:
        print("Rate limited. Waiting 10 seconds...")
        time.sleep(10)
    else:
        print("API Error:", r.status_code, r.text)
        break

print(f"Fetched {len(all_exercises)} total exercises. Inserting into database...")

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("DELETE FROM exercises")

for ex in all_exercises:
    category = ", ".join(ex.get('bodyParts', []))
    equipment = ", ".join(ex.get('equipments', []))
    
    c.execute("""
        INSERT OR REPLACE INTO exercises (
            id, name, category, equipment, primary_muscles, secondary_muscles, instructions, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ex.get('exerciseId'),
        ex.get('name'),
        category,
        equipment,
        json.dumps(ex.get('targetMuscles', [])),
        json.dumps(ex.get('secondaryMuscles', [])),
        json.dumps(ex.get('instructions', [])),
        json.dumps([ex.get('gifUrl')]) if ex.get('gifUrl') else json.dumps([])
    ))

conn.commit()
c.execute("SELECT COUNT(*) FROM exercises")
count = c.fetchone()[0]
conn.close()

print(f"Database updated. Total exercises in db: {count}")
