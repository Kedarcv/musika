class AuthService {
  // Simulated user database
  final List<Map<String, String>> _users = [];

  // Sign up a new user
  void signUp(String email, String password) {
    _users.add({'email': email, 'password': password});
  }

  // Log in an existing user
  bool login(String email, String password) {
    for (var user in _users) {
      if (user['email'] == email && user['password'] == password) {
        return true;
      }
    }
    return false;
  }
}
