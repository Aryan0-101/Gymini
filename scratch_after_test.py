import requests
url1 = 'https://oss.exercisedb.dev/api/v1/exercises?limit=50'
r1 = requests.get(url1).json()
print("First page items:", len(r1.get('data', [])))
print("First item:", r1.get('data', [])[0]['name'])

cursor = r1.get('meta', {}).get('nextCursor')
print("Cursor:", cursor)

url2 = f'https://oss.exercisedb.dev/api/v1/exercises?limit=50&after={cursor}'
r2 = requests.get(url2).json()
print("Second page items:", len(r2.get('data', [])))
print("First item of second page:", r2.get('data', [])[0]['name'])
