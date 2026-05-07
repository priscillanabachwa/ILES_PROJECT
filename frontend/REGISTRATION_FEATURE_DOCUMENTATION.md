# Registration Feature - Complete Documentation

## Overview
A complete user registration system has been implemented for the ILES (Internship Learning Evaluation System) frontend and backend. Users can now create new accounts with their credentials, which are securely stored in the database.

---

## ✅ Features Implemented

### 1. **Password Visibility Toggle**
- Users can click the eye icon (👁️) to show/hide their password while typing
- Available on both password and confirm password fields
- Smooth animations and hover effects
- Disabled during form submission

### 2. **User Registration Form**
The registration form collects the following information:
- **First Name** (Optional)
- **Last Name** (Optional)
- **Email*** (Required, must be unique)
- **Password*** (Required, minimum 8 characters)
- **Confirm Password*** (Required, must match password)
- **Role** (Dropdown: Student Intern, Workplace Supervisor, Academic Supervisor)
- **Phone Number** (Optional)

### 3. **Form Validation**
- Email format validation
- Password must be at least 8 characters long
- Password and confirm password must match
- Real-time error messages displayed to users
- Required fields marked with asterisk (*)

### 4. **Backend Integration**
- Credentials are sent to the backend API
- User data is stored in the database
- Authentication token is generated upon registration
- User can immediately log in after registration

---

## 📁 Files Created/Modified

### **Frontend (React)**

#### 1. **src/pages/Register.jsx** (NEW)
```javascript
// Main registration component
// Features:
// - Form state management with useState
// - Email, password, phone validation
// - Password visibility toggle for both fields
// - Integration with authService.registerUser()
// - Auto-login after successful registration
// - Navigation to /dashboard on success
```
**Key Functions:**
- `handleInputChange()` - Updates form fields
- `validateForm()` - Client-side validation
- `handleSubmit()` - Sends registration data to backend
- `togglePasswordVisibility()` - Shows/hides password
- `toggleConfirmPasswordVisibility()` - Shows/hides confirm password

#### 2. **src/pages/Register.css** (NEW)
```css
/* Styling for registration form */
/* Features:
   - Responsive design (mobile, tablet, desktop)
   - Green gradient theme matching your ILES branding
   - Side-by-side first/last name fields on desktop
   - Stacked fields on mobile
   - Password input wrapper for eye icon positioning
   - Form validation error messaging
   - Smooth transitions and hover effects
*/
```

#### 3. **src/services/authService.js** (MODIFIED)
```javascript
// Added new function:
export const registerUser = async (userData) => {
  // Sends registration data to backend
  // Expected userData:
  // {
  //   email: "user@example.com",
  //   first_name: "John",
  //   last_name: "Doe",
  //   password: "password123",
  //   phone_number: "1234567890",
  //   role: "student"
  // }
  
  // Returns:
  // {
  //   token: "auth_token_string",
  //   user: { user data object }
  // }
}
```

#### 4. **src/App.jsx** (MODIFIED)
```javascript
// Added import:
import Register from './pages/Register';

// Added route:
<Route path="/register" element={<Register />} />
```

### **Backend (Django)**

#### 5. **backend/user_accounts/views.py** (MODIFIED)
```python
# Added new function:
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    Registration endpoint for creating new user accounts.
    
    Accepts: POST request with user data
    Returns: Auth token + user data
    """
    # Validates user data with CustomUserSerializer
    # Creates user in database
    # Generates auth token
    # Returns token + user info
```

#### 6. **backend/user_accounts/urls.py** (MODIFIED)
```python
# Added route:
path('register/', register_view, name='register'),

# New endpoint:
# POST /api/accounts/register/
```

---

## 🔄 Data Flow

### Registration Process:
```
1. User fills registration form
   ↓
2. Frontend validates form data
   ↓
3. Frontend calls registerUser(userData)
   ↓
4. POST request sent to /api/accounts/register/
   ↓
5. Backend validates email (unique check)
   ↓
6. Backend validates password (min 8 chars)
   ↓
7. Backend creates user in database
   ↓
8. Backend generates auth token
   ↓
9. Backend returns token + user data
   ↓
10. Frontend stores token in localStorage
   ↓
11. Frontend stores user data in localStorage
   ↓
12. Frontend redirects to /dashboard
```

---

## 🔐 Security Features

1. **Password Hashing** - Passwords are hashed using Django's `set_password()` method
2. **Token Authentication** - Authentication tokens are generated using Django REST Framework's Token Authentication
3. **Write-Only Password Field** - Passwords are never returned in API responses
4. **Email Validation** - Email format is validated and must be unique
5. **CSRF Protection** - Django's CSRF protection is enabled
6. **Unique Email Constraint** - Database constraint ensures no duplicate emails
7. **Role-Based Access** - Users can select their role (student, supervisor, admin)

---

## 🚀 How to Use

### **For Users:**

1. **Register a New Account:**
   - Click "Register here" link on the login page
   - Fill in the registration form
   - Password must be at least 8 characters
   - Click "Register" button

2. **After Registration:**
   - User is automatically logged in
   - Auth token is saved
   - Redirected to dashboard

3. **Existing Users:**
   - Can login directly with email and password
   - Password visibility toggle available
   - Links to register page if they don't have account

### **For Developers:**

#### **Start the Development Servers:**

**Backend:**
```bash
cd backend
python manage.py runserver
# Runs on http://localhost:8000
```

**Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

#### **Test Registration API Endpoint:**

```bash
# Using curl:
curl -X POST http://localhost:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "phone_number": "1234567890"
  }'
```

**Success Response (201 Created):**
```json
{
  "token": "abcd1234567890efgh",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "phone_number": "1234567890",
    "profile_picture": null
  }
}
```

---

## 📋 API Endpoints

### **Login Endpoint**
- **URL:** `POST /api/accounts/login/`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** `{ token, user }`

### **Registration Endpoint**
- **URL:** `POST /api/accounts/register/`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "1234567890",
    "role": "student"
  }
  ```
- **Response:** `{ token, user }`
- **Status Code:** `201 Created`

---

## 🐛 Troubleshooting

### **"Email already exists" error**
- Try with a different email address
- Check database if email was previously registered

### **"Password must be at least 8 characters" error**
- Ensure your password has at least 8 characters
- Special characters are allowed

### **"Passwords do not match" error**
- Make sure password and confirm password fields are identical

### **"Cannot connect to backend" error**
- Ensure Django development server is running on `http://localhost:8000`
- Check if CORS is properly configured
- Verify `API_BASE_URL` in authService.js

### **User not redirected after registration**
- Check browser console for errors
- Verify localStorage is enabled
- Check network tab for API response

---

## 📝 Form Validation Summary

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| Email | Email | ✅ Yes | Must be valid email format, must be unique |
| Password | Password | ✅ Yes | Minimum 8 characters |
| Confirm Password | Password | ✅ Yes | Must match password field |
| First Name | Text | ❌ No | Any text allowed |
| Last Name | Text | ❌ No | Any text allowed |
| Phone Number | Tel | ❌ No | Standard phone format |
| Role | Select | ✅ Yes | student, workplace_supervisor, or academic_supervisor |

---

## 🎨 UI/UX Features

1. **Responsive Design** - Works on mobile, tablet, and desktop
2. **Form Validation** - Real-time error messages
3. **Loading State** - Button shows "Creating Account..." during submission
4. **Disabled Fields** - All inputs disabled during API call
5. **Navigation Links** - Easy links between Login and Register pages
6. **Eye Icon Toggle** - Visual feedback for password visibility
7. **Smooth Transitions** - CSS animations for better UX
8. **Error Messages** - Clear, helpful error messaging
9. **Success Redirect** - Auto-redirect to dashboard after success

---

## ✨ Next Steps (Optional Enhancements)

1. **Email Verification** - Send confirmation email before account activation
2. **Password Requirements** - Enforce complex password rules
3. **Terms of Service** - Add checkbox for accepting ToS
4. **Profile Picture Upload** - Allow users to upload profile pictures during registration
5. **Social Login** - Google/GitHub OAuth integration
6. **Two-Factor Authentication** - Additional security layer
7. **Account Recovery** - Password reset functionality

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check network tab for API responses
4. Ensure both frontend and backend servers are running

---

**Created:** April 23, 2026
**System:** ILES (Internship Learning Evaluation System)
**Status:** ✅ Ready for Use
