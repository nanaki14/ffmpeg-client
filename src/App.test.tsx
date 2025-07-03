import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    const titleElement = screen.getByText('Electron + React + TypeScript');
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the ready message', () => {
    render(<App />);
    const messageElement = screen.getByText(
      'Development environment is ready!'
    );
    expect(messageElement).toBeInTheDocument();
  });

  it('renders all button variants', () => {
    render(<App />);
    const defaultButton = screen.getByText('Default Button');
    const secondaryButton = screen.getByText('Secondary');
    const outlineButton = screen.getByText('Outline');

    expect(defaultButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();
    expect(outlineButton).toBeInTheDocument();
  });
});
