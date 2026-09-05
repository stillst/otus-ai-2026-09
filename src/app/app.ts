import { Component, inject } from '@angular/core';
import { JsonDocumentStore } from './core/json-document-store';
import { loadTextFile } from './core/text-file';
import { ThemeStore } from './core/theme-store';
import { SourceEditor } from './features/editor/source-editor';
import { Toolbar } from './features/toolbar/toolbar';
import { JsonViewer } from './features/viewer/json-viewer';
import { Toast } from './shared/toast/toast';
import { ToastStore } from './shared/toast/toast-store';

@Component({
  selector: 'app-root',
  imports: [Toolbar, SourceEditor, JsonViewer, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly doc = inject(JsonDocumentStore);
  private readonly toast = inject(ToastStore);
  // Instantiated here so the theme applies before the first paint of any child.
  protected readonly theme = inject(ThemeStore);

  protected async loadFile(file: File): Promise<void> {
    try {
      this.doc.setSource(await loadTextFile(file));
    } catch (e) {
      this.toast.show(e instanceof Error ? e.message : 'Could not read the file');
    }
  }
}
