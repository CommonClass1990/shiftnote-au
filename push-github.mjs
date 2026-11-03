import fs from "node:fs";
import readline from "node:readline";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

const dir = "C:/Users/joshw/.gemini/antigravity/scratch/shiftnote-au";

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  console.log("============================================================");
  console.log("  ShiftNote AU — GitHub Push Utility");
  console.log("============================================================\n");

  const defaultUrl = "https://github.com/CommonClass1990/shiftnote-au.git";
  const repoUrl =
    process.argv[2] ||
    (await askQuestion(`Enter your GitHub repository URL [default: ${defaultUrl}]:\n> `)) ||
    defaultUrl;

  if (!repoUrl) {
    console.error("Error: Repository URL is required.");
    process.exit(1);
  }

  const token =
    process.argv[3] ||
    (await askQuestion("\nEnter your GitHub Personal Access Token (classic or fine-grained with repo access):\n> "));

  if (!token) {
    console.error("Error: GitHub Personal Access Token is required.");
    process.exit(1);
  }

  console.log("\nConnecting to GitHub and pushing 'main' branch...");

  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      url: repoUrl,
      remoteRef: "refs/heads/main",
      ref: "main",
      force: true,
      onAuth: () => ({ username: token }),
    });

    console.log("\n============================================================");
    console.log("✓ SUCCESS: Successfully pushed ShiftNote AU to GitHub!");
    console.log(`  Repository: ${repoUrl}`);
    console.log("  Branch:     main");
    console.log("============================================================\n");
  } catch (err) {
    console.error("\n[Push Failed]:", err.message || err);
    console.log("\nTroubleshooting tips:");
    console.log("1. Ensure the repository exists on GitHub (create it at https://github.com/new).");
    console.log("2. Ensure your Personal Access Token has 'repo' (write) scope.");
  }
}

main().catch(console.error);

