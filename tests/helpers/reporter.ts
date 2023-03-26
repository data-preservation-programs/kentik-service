import { SpecReporter } from 'jasmine-spec-reporter';

const textReporter = new SpecReporter({
  spec: {
    displayDuration: true,
    displayErrorMessages: true,
    displayFailed: true,
    displayPending: true,
    displaySuccessful: true,
  }
});

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(textReporter);
