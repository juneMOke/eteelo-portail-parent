import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { JustificationReason } from '../../../../core/api/conduct.contract';
import { CivilDate } from '../../../../shared/date/civil-date';
import { dayLabel } from '../../../../shared/format/day-labels';
import { injectOnline } from '../../../../shared/network/online';
import { AttachmentPickerComponent } from '../../../../shared/ui/attachment-picker/attachment-picker.component';
import { UploadFailure } from '../../../../shared/ui/file-upload/file-upload.component';
import {
  PillGroupComponent,
  PillOption,
} from '../../../../shared/ui/pill-group/pill-group.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { UploadProgressComponent } from '../../../../shared/ui/upload-progress/upload-progress.component';
import { JUSTIFICATION_REASONS } from '../../data-access/attendance-formats';
import { JustificationDraft } from '../../data-access/absence-justification.store';

export const NOTE_MAX = 200;
const ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
const ATTACHMENT_MAX_BYTES = 5_000_000;

/** « Autre » ne dit rien à l'école sans une précision. */
function noteForOther(group: AbstractControl): ValidationErrors | null {
  const { reason, note } = group.value as { reason: string | null; note: string };
  return reason === 'OTHER' && !note.trim() ? { noteRequired: true } : null;
}

/**
 * Feuille « Justifier » (② et ④) : motif, précision libre, pièce jointe facultative (photo
 * d'un certificat). La saisie reste dans la feuille tant que la page est ouverte : une
 * coupure ne perd rien, « Réessayer » renvoie la même demande. Rien n'est gardé sur le
 * téléphone (invariant 5). Présentation seule : la page envoie.
 */
@Component({
  selector: 'app-justification-sheet',
  imports: [
    AttachmentPickerComponent,
    PillGroupComponent,
    ReactiveFormsModule,
    SheetComponent,
    UploadProgressComponent,
  ],
  templateUrl: './justification-sheet.component.html',
  styleUrl: './justification-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JustificationSheetComponent {
  /** Part envoyée, de 0 à 1 ; null hors envoi. */
  readonly progress = input<number | null>(null);
  readonly failure = input<UploadFailure | null>(null);
  readonly send = output<{ date: CivilDate; draft: JustificationDraft }>();

  private readonly locale = inject(LOCALE_ID);
  private readonly sheet = viewChild.required(SheetComponent);

  protected readonly online = injectOnline();
  protected readonly date = signal<CivilDate | null>(null);
  protected readonly file = signal<File | null>(null);
  protected readonly form = new FormGroup(
    {
      reason: new FormControl<JustificationReason | null>(null, Validators.required),
      note: new FormControl('', { nonNullable: true, validators: Validators.maxLength(NOTE_MAX) }),
    },
    { validators: noteForOther },
  );
  protected readonly reason = toSignal(this.form.controls.reason.valueChanges, {
    initialValue: null,
  });
  private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected readonly reasons: readonly PillOption[] = JUSTIFICATION_REASONS.map((reason) => ({
    id: reason.id,
    label: reason.label,
    available: true,
    hint: null,
  }));
  protected readonly noteMax = NOTE_MAX;
  protected readonly attachmentTypes = ATTACHMENT_TYPES;
  protected readonly attachmentMaxBytes = ATTACHMENT_MAX_BYTES;
  protected readonly sending = computed(() => this.progress() !== null);
  protected readonly canSend = computed(
    () => this.status() === 'VALID' && this.online() && (this.failure()?.retryable ?? true),
  );
  protected readonly heading = computed(() => {
    const date = this.date();
    return date ? `Justifier l’absence du ${dayLabel(date, this.locale).toLowerCase()}` : '';
  });

  /** Ouvre la feuille ; une saisie commencée pour un autre jour repart de zéro. */
  open(date: CivilDate): void {
    if (date !== this.date()) this.reset();
    this.date.set(date);
    this.sheet().open();
  }

  /** L'école a reçu la justification : la saisie est oubliée. */
  done(): void {
    this.sheet().close();
    this.reset();
    this.date.set(null);
  }

  protected pickReason(id: string | null): void {
    this.form.controls.reason.setValue(id as JustificationReason | null);
  }

  protected submit(): void {
    const date = this.date();
    const { reason, note } = this.form.getRawValue();
    if (!date || !reason || !this.canSend() || this.sending()) return;
    this.send.emit({ date, draft: { reason, note, file: this.file() } });
  }

  private reset(): void {
    this.form.reset({ reason: null, note: '' });
    this.file.set(null);
  }
}
