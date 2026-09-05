import { Clipboard } from '@angular/cdk/clipboard';
import { inject, Service } from '@angular/core';

/** Writes text to the clipboard, with a fallback for insecure contexts. */
@Service()
export class ClipboardWriter {
  private readonly cdkClipboard = inject(Clipboard);

  async copy(text: string): Promise<boolean> {
    try {
      if (globalThis.navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through to the execCommand-based fallback.
    }
    return this.cdkClipboard.copy(text);
  }
}
