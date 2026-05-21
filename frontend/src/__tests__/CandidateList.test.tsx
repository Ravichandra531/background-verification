import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateList from '../components/CandidateList';
import api from '../services/api';

jest.mock('../services/api');

describe('CandidateList Component', () => {
  const mockOnViewDetails = jest.fn();
  const mockOnClearCreateFlag = jest.fn();

  const mockCandidates = [
    {
      id: '1',
      fullName: 'John Doe',
      email: 'john@test.com',
      phone: '9876543210',
      status: 'verified',
      createdAt: new Date('2026-05-20'),
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      email: 'jane@test.com',
      phone: '9876543211',
      status: 'pending',
      createdAt: new Date('2026-05-21'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        candidates: mockCandidates,
        pagination: { total: 2, totalPages: 1 },
      },
    });
  });

  describe('Candidate List Display', () => {
    it('should render candidate list', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display candidate details in table', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('john@test.com')).toBeInTheDocument();
        expect(screen.getByText('9876543210')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show empty state when no candidates', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: {
          candidates: [],
          pagination: { total: 0, totalPages: 1 },
        },
      });

      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No candidates found')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search candidates by name', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search candidate/i);
      await userEvent.type(searchInput, 'John');
      await userEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('search=John')
        );
      });
    });

    it('should filter by status', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      await waitFor(() => {
        const verifiedButton = screen.getByText('verified');
        fireEvent.click(verifiedButton);
      });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('status=verified')
        );
      });
    });
  });

  describe('Add Candidate Modal', () => {
    it('should open add candidate modal', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const addButton = screen.getByText('Add Candidate');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add candidate')).toBeInTheDocument();
      });
    });

    it('should validate candidate form fields', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const addButton = screen.getByText('Add Candidate');
      await userEvent.click(addButton);

      const submitButton = screen.getByText('Save Candidate');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Full name must be/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const addButton = screen.getByText('Add Candidate');
      await userEvent.click(addButton);

      const emailInput = screen.getByPlaceholderText('john@test.com');
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByText('Save Candidate');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const addButton = screen.getByText('Add Candidate');
      await userEvent.click(addButton);

      const phoneInput = screen.getByPlaceholderText('9876543210');
      await userEvent.type(phoneInput, '123');

      const submitButton = screen.getByText('Save Candidate');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid 10-digit/i)).toBeInTheDocument();
      });
    });

    it('should validate Aadhaar format', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const addButton = screen.getByText('Add Candidate');
      await userEvent.click(addButton);

      const aadhaarInput = screen.getByPlaceholderText('123412341234');
      await userEvent.type(aadhaarInput, '12345');

      const submitButton = screen.getByText('Save Candidate');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid 12-digit/i)).toBeInTheDocument();
      });
    });

    it('should validate PAN format', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      const addButton = screen.getByText('Add Candidate');
      await userEvent.click(addButton);

      const panInput = screen.getByPlaceholderText('ABCDE1234F');
      await userEvent.type(panInput, 'invalid');

      const submitButton = screen.getByText('Save Candidate');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid format/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Details Action', () => {
    it('should call onViewDetails when clicking view button', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('View details');
        fireEvent.click(viewButtons[0]);
      });

      expect(mockOnViewDetails).toHaveBeenCalledWith('1');
    });
  });

  describe('Delete Candidate', () => {
    it('should show delete confirmation', async () => {
      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      expect(screen.getByText('Confirm?')).toBeInTheDocument();
    });

    it('should delete candidate on confirmation', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      render(
        <CandidateList
          onViewDetails={mockOnViewDetails}
          onClearCreateFlag={mockOnClearCreateFlag}
        />
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      const yesButton = screen.getByText('Yes');
      await userEvent.click(yesButton);

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalled();
      });
    });
  });
});
