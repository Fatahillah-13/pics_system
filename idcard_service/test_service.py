import requests
import json
from datetime import datetime

# Configuration
PYTHON_SERVICE_URL = "http://127.0.0.1:5000"
LARAVEL_BASE_URL = "http://127.0.0.1:8000"

def test_health_check():
    """Test Python service health check"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{PYTHON_SERVICE_URL}/")
        print(f"✅ Status Code: {response.status_code}")
        print(f"📄 Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_get_config():
    """Test get configuration endpoint"""
    print("\n🔍 Testing get config...")
    try:
        response = requests.get(f"{PYTHON_SERVICE_URL}/config")
        print(f"✅ Status Code: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_print_single_card():
    """Test printing a single ID card (example - modify data as needed)"""
    print("\n🔍 Testing print single card...")

    # Sample data - SESUAIKAN dengan data yang ada di sistem Anda
    sample_data = [{
        "name": "John Doe",
        "department": "IT Department",
        "job_level": "Senior Developer",
        "employee_id": "EMP001",
        "photo_filename": "photos/sample.jpg",  # Ganti dengan file yang ada
        "card_template": "templates/sample_template.png"  # Ganti dengan template yang ada
    }]

    try:
        response = requests.post(
            f"{PYTHON_SERVICE_URL}/print",
            json=sample_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Status Code: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 ID Card Printing Service - Test Suite")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 Service URL: {PYTHON_SERVICE_URL}")
    print("=" * 60)

    results = []

    # Run tests
    results.append(("Health Check", test_health_check()))
    results.append(("Get Config", test_get_config()))

    # Uncomment untuk test print (pastikan data sudah sesuai)
    # results.append(("Print Single Card", test_print_single_card()))

    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print("=" * 60)
    print(f"🎯 Total: {passed}/{total} tests passed")
    print("=" * 60)

    if passed == total:
        print("🎉 All tests passed! Service is ready.")
    else:
        print("⚠️ Some tests failed. Please check the service configuration.")

if __name__ == "__main__":
    main()
