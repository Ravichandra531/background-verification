import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';
import api from '../services/api';

jest.mock('../services/api');

describe('Login Component', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Form Validation', () => {
    it('should render login form by default', () => {
      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should show error for invalid email format', async () => {
      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      const emailInput = screen.getByLabelText('Email');
      
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(screen.getByText('Sign in'));

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty password', async () => {
      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      const emailInput = screen.getByLabelText('Email');
      
      await userEvent.type(emailInput, 'user@test.com');
      await userEvent.click(screen.getByText('Sign in'));

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should enable submit button when form is valid', async () => {
      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Sign in');

      await userEvent.type(emailInput, 'user@test.com');
      await userEvent.type(passwordInput, 'password123');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Login Submission', () => {
    it('should call onAuthSuccess on successful login', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@test.com', role: 'user' };
      const mockToken = 'jwt-token';

      (api.post as jest.Mock).mockResolvedValue({
        data: { user: mockUser, token: mockToken },
      });

      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      
      await userEvent.type(screen.getByLabelText('Email'), 'john@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'SecurePass123!');
      await userEvent.click(screen.getByText('Sign in'));

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUser, mockToken, false);
      });
    });

    it('should show error message on failed login', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: { data: { error: 'Invalid credentials' } },
      });

      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      
      await userEvent.type(screen.getByLabelText('Email'), 'john@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'WrongPassword');
      await userEvent.click(screen.getByText('Sign in'));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      (api.post as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );

      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      
      await userEvent.type(screen.getByLabelText('Email'), 'john@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'SecurePass123!');
      
      const submitButton = screen.getByText('Sign in');
      await userEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Remember Me Functionality', () => {
    it('should pass remember me value to onAuthSuccess', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@test.com', role: 'user' };
      const mockToken = 'jwt-token';

      (api.post as jest.Mock).mockResolvedValue({
        data: { user: mockUser, token: mockToken },
      });

      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      
      const rememberCheckbox = screen.getByLabelText('Remember me');
      await userEvent.click(rememberCheckbox);
      
      await userEvent.type(screen.getByLabelText('Email'), 'john@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'SecurePass123!');
      await userEvent.click(screen.getByText('Sign in'));

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUser, mockToken, true);
      });
    });
  });

  describe('Toggle Between Login and Signup', () => {
    it('should toggle to signup form', async () => {
      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      
      const toggleButton = screen.getByText(/Don't have an account/i);
      await userEvent.click(toggleButton);

      expect(screen.getByText('Create an account')).toBeInTheDocument();
      expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    });

    it('should toggle back to login form', async () => {
      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      
      let toggleButton = screen.getByText(/Don't have an account/i);
      await userEvent.click(toggleButton);

      toggleButton = screen.getByText(/Already have an account/i);
      await userEvent.click(toggleButton);

      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      render(<Login onAuthSuccess={mockOnAuthSuccess} />);
      
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      expect(passwordInput.type).toBe('text');
    });
  });
});
