import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signInButton: Locator;
  readonly changePassword: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = this.page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = this.page.getByRole('textbox', { name: 'Password' });
    this.confirmPasswordInput = this.page.getByRole('textbox', { name: 'Confirm Password' });
    this.signInButton = this.page.getByRole('button', { name: 'Sign In' });
    this.changePassword = this.page.getByRole('button', { name: 'Change Password' });
  }

  async login(email: string, password: string) {
    console.log(`Logging in with email: ${email} and password: ${password}`);
    console.log('Filling emaill ...');
    await this.emailInput.fill(email);
    console.log('Filling password ...');
    await this.passwordInput.fill(password);
    console.log('Clicking sign in button ...');
    await this.signInButton.click();
  }

  async changePasswordFunc(email: string, password: string, confirmPassword: string) {
    console.log(`Changing password for email: ${email}`);
    console.log('Filling email ...');
    await this.emailInput.fill(email);
    console.log('Filling new password ...');
    await this.passwordInput.fill(password);
    console.log('Filling confirm password ...');
    await this.confirmPasswordInput.fill(confirmPassword);
    console.log('Clicking change password button ...');
    await this.changePassword.click();
  }
}
