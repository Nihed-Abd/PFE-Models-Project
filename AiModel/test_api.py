import requests
import json

def test_model_api():
    """
    Test the AI model API endpoint locally
    """
    url = "http://localhost:8000/predict"
    
    # Test data
    data = {
        "prompt": "C'est quoi un ERP ? Réponse :"
    }
    
    # Send POST request
    try:
        response = requests.post(url, json=data)
        
        # Check if request was successful
        if response.status_code == 200:
            result = response.json()
            print("API Response:")
            print(json.dumps(result, indent=4))
        else:
            print(f"Error: Received status code {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server. Make sure it's running.")

if __name__ == "__main__":
    test_model_api()
