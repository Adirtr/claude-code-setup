import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  private spinner: Ora | null = null;

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  dim(message: string): void {
    console.log(chalk.dim(message));
  }

  log(message: string): void {
    console.log(message);
  }

  newline(): void {
    console.log();
  }

  header(message: string): void {
    console.log();
    console.log(chalk.bold.cyan(message));
    console.log(chalk.cyan('─'.repeat(message.length)));
  }

  box(message: string): void {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(l => l.length));
    const border = '═'.repeat(maxLength + 4);

    console.log();
    console.log(chalk.cyan(`╔${border}╗`));
    lines.forEach(line => {
      const padding = ' '.repeat(maxLength - line.length);
      console.log(chalk.cyan('║  ') + chalk.bold(line) + padding + chalk.cyan('  ║'));
    });
    console.log(chalk.cyan(`╚${border}╝`));
    console.log();
  }

  startSpinner(message: string): void {
    this.spinner = ora({
      text: message,
      color: 'cyan',
    }).start();
  }

  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  list(items: string[], prefix: string = '├─'): void {
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const symbol = isLast ? '└─' : prefix;
      console.log(chalk.dim(symbol), item);
    });
  }

  tree(items: { [key: string]: string[] }): void {
    const keys = Object.keys(items);
    keys.forEach((key, keyIndex) => {
      const isLastKey = keyIndex === keys.length - 1;
      const keySymbol = isLastKey ? '└─' : '├─';
      console.log(chalk.cyan(keySymbol), chalk.bold(key));

      const values = items[key];
      values.forEach((value, valueIndex) => {
        const isLastValue = valueIndex === values.length - 1;
        const prefix = isLastKey ? '   ' : '│  ';
        const valueSymbol = isLastValue ? '└─' : '├─';
        console.log(chalk.dim(`${prefix}${valueSymbol}`), value);
      });
    });
  }
}

// Export singleton instance
export const logger = new Logger();
