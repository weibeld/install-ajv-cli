const core = require('@actions/core');
const { exec, execSync } = require("child_process");

function fail(err) {
  core.setFailed(err);
}

try {
  // Install
  console.log(execSync("sudo npm install -g ajv-cli").toString());
  // Verify
  execSync("ajv help");
  console.log("Installation successful");
} catch (err) {
  fail(err);
}


