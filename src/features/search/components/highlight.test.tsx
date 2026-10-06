import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Highlight } from './highlight';

describe('Highlight', () => {
  it('marks every case-insensitive match and escapes regex characters', () => {
    const { container } = render(<Highlight text="Fix (auth) bypass in AUTH middleware" query="auth" />);
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['auth', 'AUTH']);
    const { container: c2 } = render(<Highlight text="Fix (auth)" query="(auth)" />);
    expect(c2.querySelector('mark')?.textContent).toBe('(auth)');
  });
});
