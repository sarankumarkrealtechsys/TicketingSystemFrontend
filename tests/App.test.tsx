import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../src/App';

describe('App Component', () => {
  it('renders RTS Help Desk root without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Loading session|RTS HELP DESK/i)).toBeInTheDocument();
  });
});
