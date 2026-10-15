// This file prepares and starts the app locally without Docker.
// Install Java 21 and Node.js, then fill the root .env settings.
// Run npm run setup, npm run check and npm run dev from the root.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, copyFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const windows = process.platform === 'win32';
const children = new Set();
let stopping = false;

export function loadEnvironment(directory, inherited = process.env) {
  const filename = join(directory, '.env');
  const values = existsSync(filename)
    ? parseEnv(readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''))
    : {};
  return { ...values, ...inherited };
}

export function validateConfiguration(env) {
  const missing = ['DATABASE_URL', 'DATABASE_USER', 'DATABASE_PASSWORD', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']
    .filter((key) => !env[key]?.trim() || /YOUR_|replace-with-|choose-your-/i.test(env[key]));
  if (missing.length) {
    throw new Error(`Fill these values in the root .env file, then save it: ${missing.join(', ')}. See .env.example. No Docker is required.`);
  }
  if (!env.DATABASE_URL.startsWith('jdbc:postgresql://')) {
    throw new Error('DATABASE_URL must start with jdbc:postgresql://. Use the Java/JDBC connection format from Neon.');
  }
  if (env.ADMIN_PASSWORD.length < 12 || Buffer.byteLength(env.ADMIN_PASSWORD, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters and at most 72 UTF-8 bytes.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ADMIN_EMAIL)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }
  for (const [key, fallback] of [['PORT', '8080'], ['FRONTEND_PORT', '5173']]) {
    const value = env[key] || fallback;
    if (!/^\d+$/.test(value) || Number(value) < 1024 || Number(value) > 65535) {
      throw new Error(`${key} must be a port between 1024 and 65535.`);
    }
  }
  if ((env.PORT || '8080') === (env.FRONTEND_PORT || '5173')) {
    throw new Error('PORT and FRONTEND_PORT must be different.');
  }
  if (env.COOKIE_SECURE === 'true') {
    throw new Error('Set COOKIE_SECURE=false for this local HTTP launcher. Secure cookies require an HTTPS deployment.');
  }
}

export async function assertPortAvailable(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${port} is already in use. Stop the previous app, or choose another PORT / FRONTEND_PORT in .env.`)));
    server.listen(Number(port), '127.0.0.1', () => server.close(resolve));
  });
}

function checkJava(env) {
  const executable = env.JAVA_HOME
    ? join(env.JAVA_HOME, 'bin', windows ? 'java.exe' : 'java')
    : 'java';
  const result = spawnSync(executable, ['-version'], { env, encoding: 'utf8', windowsHide: true });
  const version = `${result.stdout || ''}\n${result.stderr || ''}`.match(/version "(\d+)/);
  if (result.error || result.status !== 0 || !version || Number(version[1]) < 21) {
    throw new Error('Java 21+ JDK was not found. Install a JDK, set JAVA_HOME to its installation folder (not its bin folder), and reopen the terminal. You may also set JAVA_HOME in .env. Maven is included through the wrapper.');
  }
  if (!env.JAVA_HOME) {
    const properties = spawnSync(executable, ['-XshowSettings:properties', '-version'], { env, encoding: 'utf8', windowsHide: true });
    const javaHome = `${properties.stdout || ''}\n${properties.stderr || ''}`.match(/^\s*java\.home\s*=\s*(.+)$/m)?.[1]?.trim();
    if (javaHome) env.JAVA_HOME = javaHome;
  }
  const compiler = spawnSync(join(env.JAVA_HOME || '', 'bin', windows ? 'javac.exe' : 'javac'), ['-version'], { env, encoding: 'utf8', windowsHide: true });
  if (compiler.error || compiler.status !== 0) throw new Error('A full Java JDK is required; a JRE alone cannot compile the backend. Check JAVA_HOME.');
  console.log(`Java ${version[1]} detected.`);
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (windows) spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    else { try { process.kill(-child.pid, 'SIGTERM'); } catch {  } }
  }
  process.exitCode = exitCode;
}

function launch(executable, args, cwd, env, label) {
  const batch = windows && /\.(cmd|bat)$/i.test(executable);
  const command = batch ? `"${executable}"` : executable;
  const child = spawn(command, args, { cwd, env, stdio: 'inherit', shell: batch, windowsHide: true, detached: !windows });
  children.add(child);
  child.once('error', () => { console.error(`Could not start ${label}. Check the prerequisites in README.md.`); stop(1); });
  child.once('exit', (code) => {
    children.delete(child);
    if (!stopping && code !== 0) console.error(`${label} stopped with exit code ${code}. Check the messages above.`);
  });
  return child;
}

async function runNpmInstall() {
  console.log('Installing frontend dependencies from the lockfile…');
  const npmCli = process.env.npm_execpath;
  const child = npmCli
    ? launch(process.execPath, [npmCli, 'ci'], join(root, 'frontend'), process.env, 'Dependency installation')
    : launch(windows ? 'npm.cmd' : 'npm', ['ci'], join(root, 'frontend'), process.env, 'Dependency installation');
  const code = await new Promise((resolve) => { child.once('exit', resolve); child.once('error', () => resolve(1)); });
  if (code !== 0) throw new Error('Dependency installation failed. Check the network connection and messages above.');
}

async function waitForBackend(port, child) {
  console.log('Waiting for the backend to start (the first run downloads Maven dependencies)…');
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline && !stopping) {
    if (child.exitCode !== null) throw new Error('The backend did not start. Check the error above and your database settings.');
    try {
      const response = await fetch(`http://127.0.0.1:${port}/actuator/health/readiness`, { signal: AbortSignal.timeout(1500) });
      if (response.ok && (await response.json()).status === 'UP') return;
    } catch {  }
    await delay(1000);
  }
  if (!stopping) throw new Error('The backend was not ready within five minutes. Check its logs, database access, and internet connection.');
}

export async function main(mode = process.argv[2] || 'dev') {
  if (!['setup', 'check', 'dev', 'backend', 'frontend'].includes(mode)) throw new Error('Use npm run setup, npm run check, npm run dev, npm run dev:backend, or npm run dev:frontend.');
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Install Node.js 22.13 or newer.');
  if (!existsSync(join(root, '.env'))) {
    copyFileSync(join(root, '.env.example'), join(root, '.env'));
    console.log('Created .env from .env.example. Fill in your database and admin values and save the file.');
  }
  const env = loadEnvironment(root);
  if (mode === 'setup') {
    checkJava(env);
    await runNpmInstall();
    console.log('Setup complete. Save your settings in .env, then run npm run dev.');
    return;
  }
  const backendPort = env.PORT || '8080';
  const frontendPort = env.FRONTEND_PORT || '5173';
  if (mode !== 'frontend') {
    validateConfiguration(env);
    checkJava(env);
    await assertPortAvailable(backendPort);
  }
  if (mode !== 'backend') await assertPortAvailable(frontendPort);
  if (mode === 'check') {
    console.log('Local configuration, Java, and ports are ready. Database credentials will be checked when the backend connects.');
    return;
  }
  if (mode !== 'backend' && !existsSync(join(root, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'))) await runNpmInstall();
  if (stopping) return;
  let backend;
  if (mode !== 'frontend') {
    backend = windows
      ? launch(join(root, 'backend', 'mvnw.cmd'), ['spring-boot:run'], join(root, 'backend'), env, 'Backend')
      : launch('sh', [join(root, 'backend', 'mvnw'), 'spring-boot:run'], join(root, 'backend'), env, 'Backend');
    backend.once('exit', (code) => { if (!stopping) stop(code || 0); });
    await waitForBackend(backendPort, backend);
  }
  if (stopping) return;
  if (mode !== 'backend') {
    const frontendEnv = { ...process.env, API_PORT: backendPort, FRONTEND_PORT: frontendPort };
    const frontend = launch(process.execPath, [join(root, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--strictPort'], join(root, 'frontend'), frontendEnv, 'Frontend');
    frontend.once('exit', (code) => { if (!stopping) stop(code || 0); });
    console.log(`\nLocal app: http://127.0.0.1:${frontendPort}\nPress Ctrl+C to stop the processes started by this command.\n`);
  } else console.log(`Backend ready on port ${backendPort}. Press Ctrl+C to stop it.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.once('SIGINT', () => stop());
  process.once('SIGTERM', () => stop());
  main().catch((error) => { console.error(`\nSetup needs attention: ${error.message}\n`); stop(1); });
}
