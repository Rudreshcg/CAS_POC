import requests
import json
import time
import os

BASE_URL = "http://127.0.0.1:5000"
FILE_PATH = "c:/SMC-MAX/CAS_POC/uploads/input_data.csv"

def upload_file():
    print("Uploading file...")
    with open(FILE_PATH, 'rb') as f:
        files = {'file': f}
        res = requests.post(f"{BASE_URL}/upload", files=files)
    print(f"Upload Status: {res.status_code}")
    print(res.json())
    return "input_data.csv"

def process_file(filename):
    print(f"Processing {filename}...")
    res = requests.get(f"{BASE_URL}/process/{filename}", stream=True)
    
    for line in res.iter_lines():
        if line:
            decoded = line.decode('utf-8').replace('data: ', '')
            try:
                data = json.loads(decoded)
                if data['type'] == 'log':
                    pass # print(f"LOG: {data['message']}")
                elif data['type'] == 'complete':
                    print("Processing Complete!")
                    print(f"Total: {data['total']}, Found: {data['found']}")
                    break
                elif data['type'] == 'error':
                    print(f"ERROR: {data['message']}")
                    break
            except:
                pass

def check_results():
    print("Checking /api/results...")
    res = requests.get(f"{BASE_URL}/api/results")
    if res.status_code == 200:
        data = res.json()
        print(f"Total records in DB: {len(data)}")
        if len(data) > 0:
            print("Sample Record Keys:", data[0].keys())
            print("Sample Grade/Purity:", data[0].get('grade'), data[0].get('purity'))
    else:
        print("Failed to get results")

def check_clusters():
    print("Checking /api/clusters...")
    res = requests.get(f"{BASE_URL}/api/clusters")
    if res.status_code == 200:
        data = res.json()
        print("Root Name:", data.get('name'))
        print("Children Count:", len(data.get('children', [])))
        
        # Traverse a bit to verify hierarchy
        if data.get('children'):
            brand = data['children'][0]
            print(f"Level 1 (Brand): {brand['name']}")
            if brand.get('children'):
                cas = brand['children'][0]
                print(f"  Level 2 (CAS): {cas['name']}")
                if cas.get('children'):
                    grade = cas['children'][0]
                    print(f"    Level 3 (Grade): {grade['name']}")
                    if grade.get('children'):
                        purity = grade['children'][0]
                        print(f"      Level 4 (Purity): {purity['name']}")
                        if purity.get('children'):
                            color = purity['children'][0]
                            print(f"        Level 5 (Color): {color['name']}")
                            if color.get('children'):
                                mat = color['children'][0]
                                print(f"          Level 6 (Material): {mat['name']}")
    else:
        print("Failed to get clusters")

if __name__ == "__main__":
    try:
        filename = upload_file()
        process_file(filename)
        check_results()
        check_clusters()
    except Exception as e:
        print(f"Verification Failed: {e}")
