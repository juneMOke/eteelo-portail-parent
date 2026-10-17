import { Directive, ElementRef, OnChanges, SimpleChanges, inject, input } from '@angular/core';

/**
 * Surligne un élément que la réponse du serveur vient d'ajouter ou de changer, quand la page
 * s'affichait déjà depuis la mémoire de la session : fond Bleu Brume qui s'éteint en 2 s
 * (`refresh-highlight`, dans base.css). Rien à la première visite, ni quand c'est le parent qui
 * change de jour ou de filtre : seul `refreshed` (de `sessionResource`) l'autorise.
 */
@Directive({ selector: '[uiRefreshHighlight]' })
export class RefreshHighlightDirective implements OnChanges {
  /** Ce que montre l'élément : il est surligné quand cela change. */
  readonly value = input.required<unknown>({ alias: 'uiRefreshHighlight' });
  /** La valeur affichée vient d'arriver du serveur. */
  readonly refreshed = input.required<boolean>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.refreshed()) return;
    const change = changes['value'];
    if (!change) return;
    const changed =
      change.firstChange ||
      JSON.stringify(change.previousValue) !== JSON.stringify(change.currentValue);
    if (changed) this.highlight();
  }

  private highlight(): void {
    this.element.classList.remove('refresh-highlight');
    // Relance l'animation sur un élément déjà surligné.
    void this.element.offsetWidth;
    this.element.classList.add('refresh-highlight');
    this.element.addEventListener(
      'animationend',
      () => this.element.classList.remove('refresh-highlight'),
      { once: true },
    );
  }
}
