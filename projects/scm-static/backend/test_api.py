import requests
import sys

def test_api(port=8000):
    base_url = f"http://localhost:{port}"
    
    print(f"\n--- Testing Backend at {base_url} ---\n")
    
    def check_response(label, r):
        print(f"[{label}] Status: {r.status_code}")
        content_type = r.headers.get('Content-Type', '')
        # print(f"[{label}] Content-Type: {content_type}")
        
        if 'application/json' in content_type:
            try:
                print(f"[{label}] JSON Body: {r.json()}")
            except Exception as e:
                print(f"[{label}] FAILED TO PARSE JSON: {e}")
        else:
            print(f"[{label}] NON-JSON BODY (First 100 chars): {r.text[:100]}")
            if r.status_code == 500:
                print(f"[{label}] CRITICAL: Server returned HTML 500. Proxy or Handler crash!")

    # 1. Test Health
    try:
        r = requests.get(f"{base_url}/api/health")
        check_response("HEALTH", r)
    except Exception as e:
        print(f"[HEALTH] CONNECTION FAILED: {e}")
    
    # 2. Test POST download-request (VALID)
    try:
        payload = {"name": "Test User", "email": "test@business.com"}
        r = requests.post(f"{base_url}/api/download-request", json=payload)
        check_response("POST DOWNLOAD VALID", r)
    except Exception as e:
        print(f"[POST DOWNLOAD VALID] CONNECTION FAILED: {e}")

    # 3. Test POST contact (VALID)
    try:
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@business.com",
            "job_title": "CPO",
            "company": "Acme Corp",
            "direct_spend": "Over $1B",
            "erp_systems": ["SAP", "Oracle"],
            "procurement_systems": ["Coupa"]
        }
        r = requests.post(f"{base_url}/api/contact", json=payload)
        check_response("POST CONTACT VALID", r)
    except Exception as e:
        print(f"[POST CONTACT VALID] CONNECTION FAILED: {e}")

    # 4. Test POST contact (INVALID EMAIL)
    try:
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@gmail.com",
            "job_title": "CPO",
            "company": "Acme Corp",
            "direct_spend": "Under $50M",
            "erp_systems": [],
            "procurement_systems": []
        }
        r = requests.post(f"{base_url}/api/contact", json=payload)
        check_response("POST CONTACT INVALID EMAIL", r)
    except Exception as e:
        print(f"[POST CONTACT INVALID EMAIL] CONNECTION FAILED: {e}")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    test_api(port)
