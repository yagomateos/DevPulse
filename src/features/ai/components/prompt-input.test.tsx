import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PromptInput } from './prompt-input';

describe('PromptInput', () => {
  it('submits on Enter, inserts a newline on Shift+Enter and clears after sending', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onSubmit={onSubmit} onStop={vi.fn()} isStreaming={false} />);
    const box = screen.getByRole('textbox', { name: /message the ai assistant/i });
    await user.type(box, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('line one\nline two');
    expect(box).toHaveValue('');
  });

  it('ignores empty prompts and offers Stop while streaming', async () => {
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<PromptInput onSubmit={onSubmit} onStop={onStop} isStreaming={false} />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    rerender(<PromptInput onSubmit={onSubmit} onStop={onStop} isStreaming />);
    await user.click(screen.getByRole('button', { name: 'Stop generating' }));
    expect(onStop).toHaveBeenCalled();
  });
});
