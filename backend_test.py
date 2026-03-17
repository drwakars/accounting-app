#!/usr/bin/env python3
"""
Comprehensive backend API tests for Accounting Ledger application
Tests all endpoints according to the review request requirements
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

class AccountingLedgerTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.headers = {'Content-Type': 'application/json'}
        self.auth_token = None
        self.auth_headers = {}
        self.test_results = []
        self.created_person_id = None
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None, 
                    use_auth: bool = True) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.api_url}{endpoint}"
        headers = self.auth_headers if use_auth and self.auth_token else self.headers
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {'error': f'Unsupported method: {method}'}, 0
                
            try:
                response_data = response.json()
            except:
                response_data = {'response_text': response.text}
                
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, {'error': str(e)}, 0
    
    def test_authentication(self):
        """Test authentication scenarios"""
        print("\n=== Testing Authentication ===")
        
        # Test 1: Login with valid credentials
        login_data = {"username": "admin", "password": "admin123"}
        success, response, status_code = self.make_request('POST', '/auth/login', login_data, use_auth=False)
        
        if success and 'access_token' in response:
            self.auth_token = response['access_token']
            self.auth_headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.auth_token}'
            }
            self.log_test("Authentication - Valid Login", True, 
                         f"Successfully logged in as {response.get('user', {}).get('username', 'admin')}")
        else:
            self.log_test("Authentication - Valid Login", False, 
                         "Failed to login with admin credentials", 
                         {'response': response, 'status': status_code})
            return False
            
        # Test 2: Login with invalid credentials
        invalid_login = {"username": "admin", "password": "wrongpassword"}
        success, response, status_code = self.make_request('POST', '/auth/login', invalid_login, use_auth=False)
        
        if not success and status_code == 401:
            self.log_test("Authentication - Invalid Login", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Authentication - Invalid Login", False, 
                         "Should have rejected invalid credentials", 
                         {'response': response, 'status': status_code})
            
        # Test 3: Get current user info
        success, response, status_code = self.make_request('GET', '/auth/me')
        
        if success and 'username' in response:
            self.log_test("Authentication - Get Current User", True, 
                         f"Retrieved user info for {response['username']}")
        else:
            self.log_test("Authentication - Get Current User", False, 
                         "Failed to get current user info", 
                         {'response': response, 'status': status_code})
            
        return True
    
    def test_people_management(self):
        """Test people management functionality"""
        print("\n=== Testing People Management ===")
        
        if not self.auth_token:
            self.log_test("People Management", False, "No auth token available")
            return False
            
        # Test 1: Create a new person with Arabic name
        person_data = {
            "name": "محمد أحمد",
            "initial_usd": 1000.0,
            "initial_iqd": 1500000.0
        }
        
        success, response, status_code = self.make_request('POST', '/people', person_data)
        
        if success and 'id' in response:
            self.created_person_id = response['id']
            self.log_test("People - Create Person", True, 
                         f"Created person '{response['name']}' with ID: {self.created_person_id}")
            
            # Verify initial balances
            if (response.get('balance_usd') == 1000.0 and 
                response.get('balance_iqd') == 1500000.0):
                self.log_test("People - Initial Balances", True, 
                             "Initial balances set correctly (USD: 1000, IQD: 1500000)")
            else:
                self.log_test("People - Initial Balances", False, 
                             f"Incorrect initial balances: USD: {response.get('balance_usd')}, IQD: {response.get('balance_iqd')}")
        else:
            self.log_test("People - Create Person", False, 
                         "Failed to create person", 
                         {'response': response, 'status': status_code})
            return False
        
        # Test 2: Get all people
        success, response, status_code = self.make_request('GET', '/people')
        
        if success and isinstance(response, list):
            found_person = None
            for person in response:
                if person.get('id') == self.created_person_id:
                    found_person = person
                    break
                    
            if found_person:
                self.log_test("People - Get All People", True, 
                             f"Found created person in list (total: {len(response)})")
            else:
                self.log_test("People - Get All People", False, 
                             "Created person not found in people list")
        else:
            self.log_test("People - Get All People", False, 
                         "Failed to get people list", 
                         {'response': response, 'status': status_code})
        
        # Test 3: Get person by ID
        if self.created_person_id:
            success, response, status_code = self.make_request('GET', f'/people/{self.created_person_id}')
            
            if success and response.get('id') == self.created_person_id:
                self.log_test("People - Get Person By ID", True, 
                             f"Retrieved person details for ID: {self.created_person_id}")
            else:
                self.log_test("People - Get Person By ID", False, 
                             "Failed to get person by ID", 
                             {'response': response, 'status': status_code})
        
        return True
    
    def test_transactions(self):
        """Test transaction functionality"""
        print("\n=== Testing Transactions ===")
        
        if not self.auth_token or not self.created_person_id:
            self.log_test("Transactions", False, "Prerequisites not met (auth token or person ID)")
            return False
        
        # Test 1: Create a deposit transaction
        deposit_data = {
            "person_id": self.created_person_id,
            "type": "deposit",
            "currency": "USD",
            "amount": 500.0,
            "note": "Test deposit transaction"
        }
        
        success, response, status_code = self.make_request('POST', '/transactions', deposit_data)
        
        if success and 'id' in response:
            deposit_tx_id = response['id']
            self.log_test("Transactions - Create Deposit", True, 
                         f"Created USD deposit of 500 (ID: {deposit_tx_id})")
        else:
            self.log_test("Transactions - Create Deposit", False, 
                         "Failed to create deposit transaction", 
                         {'response': response, 'status': status_code})
            return False
        
        # Test 2: Create a withdraw transaction
        withdraw_data = {
            "person_id": self.created_person_id,
            "type": "withdraw",
            "currency": "IQD",
            "amount": 200000.0,
            "note": "Test withdraw transaction"
        }
        
        success, response, status_code = self.make_request('POST', '/transactions', withdraw_data)
        
        if success and 'id' in response:
            withdraw_tx_id = response['id']
            self.log_test("Transactions - Create Withdraw", True, 
                         f"Created IQD withdraw of 200000 (ID: {withdraw_tx_id})")
        else:
            self.log_test("Transactions - Create Withdraw", False, 
                         "Failed to create withdraw transaction", 
                         {'response': response, 'status': status_code})
        
        # Test 3: Get all transactions for person
        success, response, status_code = self.make_request('GET', f'/transactions/person/{self.created_person_id}')
        
        if success and isinstance(response, list):
            self.log_test("Transactions - Get Person Transactions", True, 
                         f"Retrieved {len(response)} transactions for person")
        else:
            self.log_test("Transactions - Get Person Transactions", False, 
                         "Failed to get person transactions", 
                         {'response': response, 'status': status_code})
        
        # Test 4: Verify updated balances
        success, response, status_code = self.make_request('GET', f'/people/{self.created_person_id}')
        
        if success:
            expected_usd = 1500.0  # 1000 initial + 500 deposit
            expected_iqd = 1300000.0  # 1500000 initial - 200000 withdraw
            
            actual_usd = response.get('balance_usd', 0)
            actual_iqd = response.get('balance_iqd', 0)
            
            if actual_usd == expected_usd and actual_iqd == expected_iqd:
                self.log_test("Transactions - Balance Updates", True, 
                             f"Balances updated correctly (USD: {actual_usd}, IQD: {actual_iqd})")
            else:
                self.log_test("Transactions - Balance Updates", False, 
                             f"Incorrect balances - Expected USD: {expected_usd}, IQD: {expected_iqd}; Got USD: {actual_usd}, IQD: {actual_iqd}")
        else:
            self.log_test("Transactions - Balance Updates", False, 
                         "Failed to retrieve updated person data for balance verification")
        
        # Test 5: Test overdraft protection
        overdraft_data = {
            "person_id": self.created_person_id,
            "type": "withdraw",
            "currency": "USD",
            "amount": 2000.0,  # More than available balance (1500)
            "note": "Test overdraft protection"
        }
        
        success, response, status_code = self.make_request('POST', '/transactions', overdraft_data)
        
        if not success and status_code == 400:
            self.log_test("Transactions - Overdraft Protection", True, 
                         "Correctly prevented overdraft transaction")
        else:
            self.log_test("Transactions - Overdraft Protection", False, 
                         "Should have prevented overdraft transaction", 
                         {'response': response, 'status': status_code})
        
        return True
    
    def test_reports(self):
        """Test reporting functionality"""
        print("\n=== Testing Reports ===")
        
        if not self.auth_token:
            self.log_test("Reports", False, "No auth token available")
            return False
        
        # Test: Get monthly report for current month
        current_month = datetime.now().strftime("%Y-%m")
        
        success, response, status_code = self.make_request('GET', '/reports/monthly', params={'month': current_month})
        
        if success and 'month' in response:
            self.log_test("Reports - Monthly Report", True, 
                         f"Retrieved monthly report for {current_month}")
            
            # Verify report structure
            required_fields = ['deposits_usd', 'withdraws_usd', 'deposits_iqd', 'withdraws_iqd', 'total_transactions']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Reports - Report Structure", True, 
                             "Monthly report contains all required fields")
                
                # Check if our transactions are reflected
                if response.get('deposits_usd', 0) >= 500 and response.get('withdraws_iqd', 0) >= 200000:
                    self.log_test("Reports - Transaction Calculation", True, 
                                 "Deposits and withdrawals correctly calculated in report")
                else:
                    self.log_test("Reports - Transaction Calculation", False, 
                                 f"Expected deposits_usd >= 500 and withdraws_iqd >= 200000, got: {response}")
            else:
                self.log_test("Reports - Report Structure", False, 
                             f"Missing required fields: {missing_fields}")
        else:
            self.log_test("Reports - Monthly Report", False, 
                         "Failed to get monthly report", 
                         {'response': response, 'status': status_code})
        
        return True
    
    def test_admin_functions(self):
        """Test admin-only functionality"""
        print("\n=== Testing Admin Functions ===")
        
        if not self.auth_token:
            self.log_test("Admin Functions", False, "No auth token available")
            return False
        
        # Test 1: Get all users (admin only)
        success, response, status_code = self.make_request('GET', '/admin/users')
        
        if success and isinstance(response, list):
            self.log_test("Admin - Get All Users", True, 
                         f"Retrieved {len(response)} users")
        else:
            self.log_test("Admin - Get All Users", False, 
                         "Failed to get users list", 
                         {'response': response, 'status': status_code})
        
        # Test 2: Create a new user
        new_user_data = {
            "username": "testuser",
            "password": "test123",
            "role": "user"
        }
        
        success, response, status_code = self.make_request('POST', '/admin/users', new_user_data)
        
        if success and 'id' in response:
            created_user_id = response['id']
            self.log_test("Admin - Create User", True, 
                         f"Created user 'testuser' with ID: {created_user_id}")
        else:
            self.log_test("Admin - Create User", False, 
                         "Failed to create new user", 
                         {'response': response, 'status': status_code})
        
        # Test 3: Get audit logs (admin only)
        success, response, status_code = self.make_request('GET', '/admin/audit')
        
        if success and isinstance(response, list):
            self.log_test("Admin - Get Audit Logs", True, 
                         f"Retrieved {len(response)} audit log entries")
            
            # Check if our actions are logged
            our_actions = [log for log in response if log.get('actor_username') == 'admin']
            if our_actions:
                self.log_test("Admin - Audit Logging", True, 
                             f"Found {len(our_actions)} audit entries for admin user")
            else:
                self.log_test("Admin - Audit Logging", False, 
                             "No audit entries found for admin user actions")
        else:
            self.log_test("Admin - Get Audit Logs", False, 
                         "Failed to get audit logs", 
                         {'response': response, 'status': status_code})
        
        return True
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print(f"🚀 Starting comprehensive backend API tests")
        print(f"📍 Testing against: {self.api_url}")
        print("="*60)
        
        # Check if backend is reachable
        try:
            response = requests.get(self.base_url, timeout=10)
            print(f"✅ Backend is reachable (status: {response.status_code})")
        except Exception as e:
            print(f"❌ Backend not reachable: {e}")
            return False
        
        # Run all tests
        tests = [
            self.test_authentication,
            self.test_people_management,
            self.test_transactions,
            self.test_reports,
            self.test_admin_functions
        ]
        
        all_passed = True
        for test_func in tests:
            try:
                result = test_func()
                if not result:
                    all_passed = False
            except Exception as e:
                self.log_test(test_func.__name__, False, f"Test failed with exception: {str(e)}")
                all_passed = False
        
        # Print summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%" if total > 0 else "0%")
        
        if not all_passed:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['message']}")
        
        print("\n" + "="*60)
        return all_passed

def main():
    """Main test execution"""
    # Use the configured backend URL from environment
    backend_url = "https://offline-ios-app-2.preview.emergentagent.com"
    
    # Alternative: read from .env if needed
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    backend_url = line.split('=', 1)[1].strip()
                    break
    except:
        pass
    
    print(f"Using backend URL: {backend_url}")
    
    tester = AccountingLedgerTester(backend_url)
    success = tester.run_all_tests()
    
    # Save detailed results to file
    results_file = '/app/backend_test_results.json'
    with open(results_file, 'w') as f:
        json.dump(tester.test_results, f, indent=2, default=str)
    
    print(f"📝 Detailed results saved to: {results_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())