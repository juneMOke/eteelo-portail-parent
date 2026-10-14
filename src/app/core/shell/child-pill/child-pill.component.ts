import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { Child } from '../../session/bootstrap.schema';
import { childLabel, childName, childPhoto } from '../../session/child-format';

/**
 * Pilule « Enfant affiché » : dit de quel enfant parle la page et ouvre la feuille « Mes enfants ».
 * Complète au bureau, réduite à l'avatar en dessous de 905 px. Inerte s'il n'y a qu'un enfant.
 */
@Component({
  selector: 'app-child-pill',
  imports: [AvatarComponent, IconComponent, NgTemplateOutlet],
  templateUrl: './child-pill.component.html',
  styleUrl: './child-pill.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildPillComponent {
  readonly child = input.required<Child>();
  readonly interactive = input(true);
  readonly activate = output<void>();

  protected readonly name = computed(() => childName(this.child()));
  protected readonly label = computed(() => childLabel(this.child()));
  protected readonly photo = computed(() => childPhoto(this.child()));
  protected readonly accessibleLabel = computed(
    () => `Enfant affiché : ${childLabel(this.child(), ', ')}.`,
  );
}
