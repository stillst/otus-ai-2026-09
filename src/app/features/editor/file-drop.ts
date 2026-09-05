import { Directive, output, signal } from '@angular/core';

/** Turns the host into a drop target for a single file. */
@Directive({
  selector: '[appFileDrop]',
  host: {
    '[class.drop-active]': 'active()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class FileDrop {
  readonly active = signal(false);
  readonly fileDropped = output<File>();

  protected onDragOver(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.active.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && host.contains(event.relatedTarget)) return;
    this.active.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.active.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.fileDropped.emit(file);
  }
}
