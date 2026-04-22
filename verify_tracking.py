from fastapi.testclient import TestClient
import sys
import os

# Add the project root to sys.path to import the app
sys.path.append(os.getcwd())

try:
    from projects.scm_static.backend.main import app, DOWNLOAD_TRACKS
except ImportError as e:
    print(f"Error importing app: {e}")
    sys.exit(1)

client = TestClient(app)

def test_download_tracking():
    # 1. Request a download
    payload = {"name": "Test User", "email": "test@business.com"}
    response = client.post("/api/download-request", json=payload)
    assert response.status_code == 200
    
    # Get the token from the dictionary (since it's not returned in API)
    token = list(DOWNLOAD_TRACKS.keys())[0]
    user_data = DOWNLOAD_TRACKS[token]
    assert user_data["notified"] is False
    print(f"Token created: {token}")
    
    # 2. First click
    response = client.get(f"/api/download/{token}", follow_redirects=False)
    assert response.status_code == 307  # Redirect
    assert DOWNLOAD_TRACKS[token]["notified"] is True
    print("First click: 'notified' set to True")
    
    # 3. Second click
    # Reset some data to verify it doesn't trigger again (logic check)
    # The actual background task is handled by FastAPI, we just check the state
    response = client.get(f"/api/download/{token}", follow_redirects=False)
    assert response.status_code == 307
    assert DOWNLOAD_TRACKS[token]["notified"] is True
    print("Second click: 'notified' remains True")

if __name__ == "__main__":
    test_download_tracking()
    print("\nSUCCESS: Download tracking logic verified.")
