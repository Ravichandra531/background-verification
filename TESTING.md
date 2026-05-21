# Testing Guide

This document outlines the testing setup and how to run tests for the Background Verification Platform.

## Backend Testing

### Setup

Backend tests use **Jest** and **Supertest** for API testing.

**Dependencies:**
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest
- `supertest` - HTTP assertion library
- `@types/jest` - TypeScript types for Jest
- `@types/supertest` - TypeScript types for Supertest

### Running Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Files

#### 1. **auth.test.ts** - Authentication Tests
Tests for user registration and login functionality.

**Test Cases:**
- ✅ Register new user with valid credentials
- ✅ Reject registration with weak password
- ✅ Reject registration with missing uppercase letter
- ✅ Reject registration with missing special character
- ✅ Reject registration if user already exists
- ✅ Reject registration with missing fields
- ✅ Login user with valid credentials
- ✅ Reject login with invalid email
- ✅ Reject login with invalid password
- ✅ Reject login with missing fields

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (!@#$%^&*(),.?":{}|<>)

#### 2. **validation.test.ts** - Input Validation Tests
Tests for Aadhaar, PAN, Email, and Phone validation.

**Aadhaar Validation:**
- ✅ Valid 12-digit Aadhaar number
- ✅ Reject less than 12 digits
- ✅ Reject more than 12 digits
- ✅ Reject non-numeric characters
- ✅ Reject with spaces

**PAN Validation:**
- ✅ Valid PAN format (ABCDE1234F)
- ✅ Reject lowercase letters
- ✅ Reject incorrect length
- ✅ Reject numbers in first 5 positions
- ✅ Reject letters in middle 4 positions
- ✅ Reject number in last position
- ✅ Reject special characters

**Email Validation:**
- ✅ Valid email format
- ✅ Reject without @
- ✅ Reject without domain
- ✅ Reject with spaces

**Phone Validation:**
- ✅ Valid 10-digit phone number
- ✅ Reject incorrect length
- ✅ Reject non-numeric characters
- ✅ Reject with spaces

#### 3. **candidate.test.ts** - Candidate Management Tests
Tests for candidate CRUD operations.

**Test Cases:**
- ✅ Create candidate with valid data
- ✅ Reject creation with invalid Aadhaar
- ✅ Reject creation with invalid PAN
- ✅ Reject creation with invalid phone
- ✅ Reject creation with invalid email
- ✅ Reject creation with short address
- ✅ Retrieve candidate by ID with masked data
- ✅ Return 404 for non-existent candidate
- ✅ Update candidate with valid data
- ✅ Delete candidate successfully

**Sensitive Data Masking:**
- Email: `a***c@gmail.com` (first and last char visible)
- Phone: `XXXXXX5798` (last 4 digits visible)
- Aadhaar: `XXXX-XXXX-1234` (last 4 digits visible)
- PAN: `XXXXX234F` (middle 4 chars visible)

#### 4. **report.test.ts** - Report Generation Tests
Tests for verification report generation.

**Test Cases:**
- ✅ Generate report for verified candidate
- ✅ Generate report for partially verified candidate
- ✅ Generate report for candidate with no verifications
- ✅ Return 404 for non-existent candidate
- ✅ Include generated timestamp
- ✅ Include verified by information

#### 5. **errorHandling.test.ts** - API Error Handling Tests
Tests for proper error handling and status codes.

**Test Cases:**
- ✅ Return 400 for bad request
- ✅ Return 404 for not found
- ✅ Return 500 for server error
- ✅ Return error in JSON format
- ✅ Include error message in response
- ✅ Handle undefined routes
- ✅ Handle invalid HTTP methods
- ✅ Handle malformed JSON

---

## Frontend Testing

### Setup

Frontend tests use **Jest** and **React Testing Library**.

**Dependencies:**
- `jest` - Testing framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `@testing-library/user-event` - User interaction simulation
- `jest-environment-jsdom` - DOM environment for Jest

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- Login.test.tsx

# Run with coverage
npm test -- --coverage
```

### Test Files

#### 1. **Login.test.tsx** - Login Component Tests
Tests for user authentication UI.

**Test Cases:**
- ✅ Render login form by default
- ✅ Show error for invalid email format
- ✅ Show error for empty password
- ✅ Enable submit button when form is valid
- ✅ Call onAuthSuccess on successful login
- ✅ Show error message on failed login
- ✅ Show loading state during submission
- ✅ Pass remember me value to onAuthSuccess
- ✅ Toggle to signup form
- ✅ Toggle back to login form
- ✅ Toggle password visibility

**Validation Rules:**
- Email must be valid format
- Password is required
- Remember me checkbox optional

#### 2. **CandidateList.test.tsx** - Candidate List Component Tests
Tests for candidate management UI.

**Test Cases:**
- ✅ Render candidate list
- ✅ Display candidate details in table
- ✅ Show loading state initially
- ✅ Show empty state when no candidates
- ✅ Search candidates by name
- ✅ Filter by status
- ✅ Open add candidate modal
- ✅ Validate candidate form fields
- ✅ Validate email format
- ✅ Validate phone number format
- ✅ Validate Aadhaar format
- ✅ Validate PAN format
- ✅ Call onViewDetails when clicking view button
- ✅ Show delete confirmation
- ✅ Delete candidate on confirmation

**Form Validation:**
- Full name: 2-100 characters
- Email: Valid format
- Phone: 10 digits
- Aadhaar: 12 digits
- PAN: ABCDE1234F format
- Address: 10-500 characters

---

## Test Coverage

### Backend Coverage Goals
- Controllers: 80%+
- Middleware: 75%+
- Utilities: 90%+

### Frontend Coverage Goals
- Components: 75%+
- Hooks: 80%+
- Utils: 90%+

### Generate Coverage Report

**Backend:**
```bash
cd backend
npm test -- --coverage
```

**Frontend:**
```bash
cd frontend
npm test -- --coverage
```

---

## CI/CD Integration

Tests are automatically run on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

See `.github/workflows/ci.yml` for CI configuration.

---

## Best Practices

1. **Write tests for new features** - Aim for 80%+ coverage
2. **Test edge cases** - Invalid inputs, missing data, errors
3. **Mock external dependencies** - Database, APIs, services
4. **Use descriptive test names** - Clearly state what is being tested
5. **Keep tests isolated** - Each test should be independent
6. **Clean up after tests** - Clear mocks and state between tests
7. **Test user behavior** - Focus on what users do, not implementation details

---

## Troubleshooting

### Backend Tests Failing

**Issue:** Database connection errors
- **Solution:** Ensure Prisma is properly mocked in tests

**Issue:** Module not found errors
- **Solution:** Check `jest.config.js` module resolution settings

### Frontend Tests Failing

**Issue:** "Cannot find module" errors
- **Solution:** Ensure `jest.config.js` has correct path mappings

**Issue:** "act" warnings
- **Solution:** Wrap state updates in `waitFor()` or `act()`

**Issue:** Timeout errors
- **Solution:** Increase Jest timeout: `jest.setTimeout(10000)`

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
