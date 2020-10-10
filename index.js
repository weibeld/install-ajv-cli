const core = require('@actions/core');
const cache = require('@actions/cache');
const { execSync } = require("child_process");

function fail(err) {
  core.setFailed(err);
  process.exit(1);
}

async function main() {
  try {

    if (process.env.RUNNER_OS == 'Windows') {
      fail("This action currently does not support Windows runners");
    }
 
    // Determine latest version or validate user-supplied version
    version = core.getInput('version');
    if (!version) {
      version = execSync('npm view ajv-cli version').toString().trim();
      core.info(`Latest version of ajv-cli is ${version}`);
    } else if (!execSync('npm view ajv-cli versions').includes(version)) {
      fail(`${version} is not a valid version of ajv-cli`);
    }

    key = `ajv-cli-${version}-${process.env.RUNNER_OS}-node-${process.version}`;
    installDir = `${process.env.RUNNER_TEMP}/${key}`;

    // Restore installation directory from cache, if available
    core.startGroup(`Checking cache for ajv-cli ${version}`);
    _ = await cache.restoreCache([installDir], key)

    // If cache has not been found
    if (typeof _ === 'undefined') {
      core.info("Not found");
      core.endGroup();
      // Create fresh installation of ajv-cli
      core.startGroup(`Installing ajv-cli ${version}`)
      cmd = `npm install -s --prefix ${installDir} ajv-cli@${version}`
      core.info(`${cmd}:`);
      core.info(execSync(cmd).toString().trim());
      core.endGroup();
      // Save installation directory to cache
      core.startGroup(`Caching installation directory with key ${key}`);
      try {
        await cache.saveCache([installDir], key);
      // Workaround for race condition: https://github.com/actions/toolkit/issues/537
      } catch (err) {
        if (err.message.includes("Cache already exists")) {
          core.info(`Cache entry ${key} has already been created by another worfklow`);
        } else {
          throw err;
        }
      }
      core.endGroup();
    // If cache has been found and restored
    } else {
      core.endGroup();
      core.info(`Found and restored ajv-cli ${version} from cache (${key})`);
    }
    // Add ajv binary to PATH
    binDir = execSync(`npm bin --prefix ${installDir}`).toString().trim();
    core.addPath(binDir);

    // Verify installation
    core.info("Verifying installation");
    execSync(`PATH=${binDir}:$PATH ajv help`)
    core.info(`Installation of ajv-cli ${version} successful`);
  } catch (err) {
    fail(err);
  }
}

main();
