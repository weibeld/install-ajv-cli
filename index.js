const core = require('@actions/core');
const cache = require('@actions/cache');
const { exec, execSync } = require("child_process");

function fail(err) {
  core.setFailed(err);
  process.exit(1);
}

async function main() {
  try {

    // Determine latest version or validate user-supplied version
    version = core.getInput('version');
    if (!version) {
      version = execSync('npm view ajv-cli version').toString().trim();
    } else if (!execSync('npm view ajv-cli versions').includes(version)) {
      fail(`${version} is not a valid version of ajv-cli`);
    }

    key = `ajv-cli-${version}`;
    installDir = `${process.env.RUNNER_TEMP}/${key}`;
    if (typeof await cache.restoreCache([installDir], key) === 'undefined') {
      console.log("Cache miss");
      console.log(execSync(`npm install --prefix ${installDir} ajv-cli@${version}`).toString());
      await cache.saveCache([installDir], key);
    } else {
      console.log("Cache hit");
    }
    console.log("Verifying installation");
    binDir = execSync(`npm bin --prefix ${installDir}`).toString().trim();
    core.addPath(binDir);
    execSync(`PATH=${binDir}:$PATH ajv help`);
    console.log("Installation successful");
  } catch (err) {
    fail(err);
  }
}

main();
