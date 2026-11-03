import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";

const dir = "c:/Users/joshw/OneDrive/Documents/shiftnote-au";

async function main() {
  console.log("Initializing Git repository at:", dir);
  await git.init({ fs, dir, defaultBranch: "main" });
  console.log("Git repo initialized.");

  // Get status of all files
  const files = await git.statusMatrix({ fs, dir });
  console.log(`Found ${files.length} paths to process.`);

  for (const [filepath, head, workdir, stage] of files) {
    if (workdir !== 0) {
      await git.add({ fs, dir, filepath });
    }
  }
  console.log("All non-ignored files staged.");

  const sha = await git.commit({
    fs,
    dir,
    message: "feat: initial release of ShiftNote AU - NDIS voice-to-claim and GST-free invoicing engine",
    author: {
      name: "ShiftNote AU Developer",
      email: "developer@shiftnote.com.au",
    },
  });

  console.log("Initial commit created with SHA:", sha);
}

main().catch(console.error);
