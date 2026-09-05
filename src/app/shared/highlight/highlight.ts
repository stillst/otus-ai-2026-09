import { Component, computed, input } from '@angular/core';
import { splitHighlight } from './split-highlight';

/** Renders text with occurrences of `query` wrapped in <mark>. */
@Component({
  selector: 'app-highlight',
  template: `@for (segment of segments(); track $index) {@if (segment.match) {<mark>{{ segment.text }}</mark>} @else {{{ segment.text }}}}`,
  styles: `:host { display: inline; white-space: pre; }`,
})
export class Highlight {
  readonly text = input.required<string>();
  readonly query = input('');

  protected readonly segments = computed(() => splitHighlight(this.text(), this.query()));
}
