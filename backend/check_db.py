import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def check():
    print("Checking /api/results...")
    try:
        res = requests.get(f"{BASE_URL}/api/results", timeout=5)
        if res.status_code == 200:
            data = res.json()
            print(f"Total: {len(data)}")
            if len(data) > 0:
                print("First Row:", data[0])
        else:
            print(f"Error {res.status_code}: {res.text}")
            
        print("\nChecking /api/clusters...")
        res = requests.get(f"{BASE_URL}/api/clusters", timeout=5)
        if res.status_code == 200:
            data = res.json()
            print("Cluster Root:", data.get('name'))
            print("Children:", len(data.get('children', [])))
            # print dump of structure if needed, but keep it small
        else:
            print(f"Error {res.status_code}: {res.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    check()
