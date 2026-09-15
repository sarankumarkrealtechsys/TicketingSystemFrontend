import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../src/App';

describe('App Component', () => {
  it('renders application header and title correctly', () => {
    render(<App />);
    expect(screen.getByText(/Application Template/i)).toBeInTheDocument();
    expect(screen.getByText(/Reusable Full-Stack Template/i)).toBeInTheDocument();
  });
});
