import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { AuthFacade } from '../data-access/auth.facade';
import { toE164 } from '../data-access/phone';

type Status = 'idle' | 'sending' | 'sent' | 'error';

function mobileNumber(control: AbstractControl<string>): ValidationErrors | null {
  return toE164(control.value) ? null : { mobile: true };
}

/** Saisie du téléphone : le serveur envoie un lien de connexion sur WhatsApp. */
@Component({
  selector: 'app-login-page',
  imports: [AuthLayoutComponent, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginPage {
  /** `?error=network` : le bootstrap n'a pas pu être chargé. */
  readonly error = input<string>();

  private readonly auth = inject(AuthFacade);

  protected readonly form = new FormGroup({
    phone: new FormControl('', { nonNullable: true, validators: mobileNumber }),
  });
  protected readonly phone = this.form.controls.phone;
  protected readonly status = signal<Status>('idle');
  protected readonly submitted = signal(false);

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    const phoneNumber = toE164(this.phone.value);
    if (!phoneNumber || this.status() === 'sending') return;

    this.status.set('sending');
    try {
      await this.auth.requestLink(phoneNumber);
      this.status.set('sent');
    } catch {
      this.status.set('error');
    }
  }

  protected changeNumber(): void {
    this.status.set('idle');
    this.submitted.set(false);
  }
}
