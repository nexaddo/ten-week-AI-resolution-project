import { execSync, spawn } from "node:child_process";
import { promisify } from "node:util";

const delay = promisify(setTimeout);

const containerName = "postgres-dev";
const dockerRunCommand = [
  "docker run -d",
  `--name ${containerName}`,
  "-e POSTGRES_USER=postgres",
  "-e POSTGRES_PASSWORD=postgres",
  "-e POSTGRES_DB=resolutions",
  "-p 5432:5432",
  "postgres:16-alpine",
].join(" ");

const run = (command: string, silent = false) => {
  try {
    return execSync(command, {
      stdio: silent ? "pipe" : "pipe",
    })
      .toString()
      .trim();
  } catch (error) {
    if (!silent) {
      throw error;
    }
    return "";
  }
};

const ensureDockerRunning = () => {
  try {
    execSync("docker info", { stdio: "ignore" });
  } catch {
    console.error("Docker is not running. Start Docker Desktop and try again.");
    process.exit(1);
  }
};

const containerExists = () => {
  const output = run(
    `docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`,
    true,
  );
  return output.split(/\r?\n/).includes(containerName);
};

const containerRunning = () => {
  const output = run(
    `docker ps --filter "name=${containerName}" --format "{{.Names}}"`,
    true,
  );
  return output.split(/\r?\n/).includes(containerName);
};

const waitForPostgresReady = async () => {
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    try {
      execSync(`docker exec ${containerName} pg_isready -U postgres`, {
        stdio: "ignore",
      });
      return;
    } catch {
      await delay(1000);
    }
  }

  console.error("PostgreSQL did not become ready in time.");
  process.exit(1);
};

const startDevServer = () => {
  const env = { ...process.env, NODE_ENV: "development" };
  const child = spawn("tsx", ["server/index.ts"], {
    stdio: "inherit",
    env,
    shell: true,
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
};

const main = async () => {
  ensureDockerRunning();

  if (!containerExists()) {
    console.log("Starting new PostgreSQL container...");
    run(dockerRunCommand);
  } else if (!containerRunning()) {
    console.log("Starting existing PostgreSQL container...");
    run(`docker start ${containerName}`);
  }

  console.log("Waiting for PostgreSQL to be ready...");
  await waitForPostgresReady();
  console.log("PostgreSQL is ready.");

  startDevServer();
};

main();
