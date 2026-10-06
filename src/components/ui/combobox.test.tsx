import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Combobox, type ComboboxOption } from './combobox';

const OPTIONS: ComboboxOption[] = [
  { value: 'Europe/Madrid', label: 'Europe/Madrid', keywords: ['Spain'] },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'America/New_York', label: 'America/New York' },
];

function Harness({ initial = null, clearLabel }: { initial?: string | null; clearLabel?: string }) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <>
      <Combobox options={OPTIONS} value={value} onChange={setValue} placeholder="Pick a zone" clearLabel={clearLabel} aria-label="Time zone" />
      <output>{value ?? 'none'}</output>
    </>
  );
}

describe('Combobox', () => {
  it('exposes combobox semantics and opens a filterable listbox', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('combobox', { name: 'Time zone' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('spain');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /europe\/madrid/i })).toBeInTheDocument();
  });

  it('selects with the keyboard and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('combobox', { name: 'Time zone' }));
    await user.keyboard('tokyo{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Asia/Tokyo');
    expect(screen.getByRole('combobox', { name: 'Time zone' })).toHaveTextContent('Asia/Tokyo');
    expect(screen.getByRole('combobox', { name: 'Time zone' })).toHaveFocus();
  });

  it('can clear the value with the optional “none” entry', async () => {
    const user = userEvent.setup();
    render(<Harness initial="Asia/Tokyo" clearLabel="Unassigned" />);
    await user.click(screen.getByRole('combobox', { name: 'Time zone' }));
    await user.click(screen.getByRole('option', { name: 'Unassigned' }));
    expect(screen.getByRole('status')).toHaveTextContent('none');
    expect(screen.getByRole('combobox', { name: 'Time zone' })).toHaveTextContent('Pick a zone');
  });
});
