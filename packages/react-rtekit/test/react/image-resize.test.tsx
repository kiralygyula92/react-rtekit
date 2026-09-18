import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';

describe('image resize cleanup', () => {
  it.each(['unmount', 'cancel'] as const)('stops updating an image after %s', async (end) => {
    const view = render(
      <RichTextEditor
        preset="full"
        imageOptions={{ resizable: true, maxWidth: 500 }}
        defaultValue='<p>Image</p><img src="https://example.com/image.png" alt="Photo" width="100">'
      />,
    );
    const image = screen.getByRole<HTMLImageElement>('img', { name: 'Photo' });
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });
    fireEvent.click(image);
    const handle = await screen.findByRole('button', { name: /resize/i });
    fireEvent(handle, new MouseEvent('pointerdown', { bubbles: true, clientX: 0 }));
    fireEvent(window, new MouseEvent('pointermove', { clientX: 60 }));
    expect(image.style.width).toBe('160px');
    if (end === 'unmount') view.unmount();
    else fireEvent(window, new Event('pointercancel'));
    fireEvent(window, new MouseEvent('pointermove', { clientX: 100 }));
    expect(image.style.width).toBe('');
  });
});
