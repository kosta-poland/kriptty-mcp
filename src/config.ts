export interface Config {
  apiUrl: string;
  apiToken: string;
}

function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

export function loadConfig(): Config {
  return {
    apiUrl: getEnvVar('KRIPTTY_API_URL'),
    apiToken: getEnvVar('KRIPTTY_API_TOKEN'),
  };
}

let config: Config | null = null;

export function getConfig(): Config {
  if (!config) {
    config = loadConfig();
  }
  return config;
}
