import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("Script started successfully!")
print("=" * 70)
print("Testing Authentication & Data Isolation")
print("=" * 70)

# Step 1: Register User 1 (David)
print("\n[1/6] Registering User 1 (David)...")
response = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "david@test.com",
    "password": "123456",
    "name": "David"
})
if response.status_code == 201:
    print(f"✅ David registered: {response.json()['email']}")
    user1_id = response.json()['id']
else:
    print(f"❌ Failed: {response.status_code} - {response.text}")
    exit(1)

# Step 2: Register User 2 (Yossi)
print("\n[2/6] Registering User 2 (Yossi)...")
response = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "yossi@test.com",
    "password": "123456",
    "name": "Yossi"
})
if response.status_code == 201:
    print(f"✅ Yossi registered: {response.json()['email']}")
    user2_id = response.json()['id']
else:
    print(f"❌ Failed: {response.status_code} - {response.text}")
    exit(1)

# Step 3: Login as David
print("\n[3/6] Logging in as David...")
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "david@test.com",
    "password": "123456"
})
if response.status_code == 200:
    david_token = response.json()["access_token"]
    print(f"✅ David logged in, token: {david_token[:20]}...")
else:
    print(f"❌ Failed: {response.status_code}")
    exit(1)

# Step 4: David creates meals
print("\n[4/6] David creating meals...")
response = requests.get(
    f"{BASE_URL}/meals/?date=2025-10-06",
    headers={"Authorization": f"Bearer {david_token}"}
)
if response.status_code == 200:
    david_meals = response.json()
    print(f"✅ David has {len(david_meals)} meals")
else:
    print(f"❌ Failed: {response.status_code}")
    exit(1)

# Step 5: Login as Yossi
print("\n[5/6] Logging in as Yossi...")
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "yossi@test.com",
    "password": "123456"
})
if response.status_code == 200:
    yossi_token = response.json()["access_token"]
    print(f"✅ Yossi logged in, token: {yossi_token[:20]}...")
else:
    print(f"❌ Failed: {response.status_code}")
    exit(1)

# Step 6: Yossi checks meals
print("\n[6/6] Yossi checking meals...")
response = requests.get(
    f"{BASE_URL}/meals/?date=2025-10-06",
    headers={"Authorization": f"Bearer {yossi_token}"}
)
if response.status_code == 200:
    yossi_meals = response.json()
    print(f"✅ Yossi has {len(yossi_meals)} meals")
else:
    print(f"❌ Failed: {response.status_code}")
    exit(1)

# Results
print("\n" + "=" * 70)
print("RESULTS:")
print("=" * 70)

david_ids = {m['id'] for m in david_meals}
yossi_ids = {m['id'] for m in yossi_meals}

if david_ids.intersection(yossi_ids):
    print("❌ FAILED: Users can see each other's data!")
    print(f"   Shared IDs: {david_ids.intersection(yossi_ids)}")
else:
    print("✅ PASSED: Data isolation working!")
    print(f"   David's meal IDs: {david_ids}")
    print(f"   Yossi's meal IDs: {yossi_ids}")

print("=" * 70)