#!/usr/bin/env node

import axios from "axios";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { Arguments, Argv } from "yargs";
import ora, { Ora } from "ora";
import readline from "readline";
import { exec } from "child_process";
import { execSync } from "child_process";
import { homedir } from "os";
import { join } from "path";
import fs from "fs";
import { spawn } from "child_process";
import chalk from "chalk";
import inquirer from "inquirer";
import yargsParser from "yargs-parser";

const getConfigPath = () => join(homedir(), ".nlGitConfig.json");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getApiKey = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const configPath = getConfigPath();
    let spinner: Ora;
    if (fs.existsSync(configPath)) {
      spinner = ora("Config file exists. Reading API key...").start();
      await delay(300); // Add delay
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (!config.apiKey) {
        spinner.stop();
        console.log("No API key found in config file.");
        reject(new Error("No API key found in config file."));
      } else {
        spinner.stop();
        spinner = ora("API key found. Resolving promise...").start();
        await delay(300); // Add delay
        spinner.stop();
        resolve(config.apiKey);
      }
    } else {
      spinner = ora(
        "Config file does not exist. Prompting user for API key..."
      ).start();
      await delay(300); // Add delay
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("Please enter your OpenAI API key: ", async (apiKey) => {
        // Note the async
        if (!apiKey || apiKey.trim() === "") {
          spinner.stop();
          console.log("No API key provided. Rejecting promise...");
          rl.close();
          reject(new Error("No API key provided."));
        } else {
          spinner.stop();
          spinner = ora("API key provided. Saving to config file...").start();
          await delay(300); // Add delay
          const config = { apiKey };
          fs.writeFileSync(configPath, JSON.stringify(config), "utf8");
          rl.close();
          spinner.stop();
          spinner = ora("API key saved. Resolving promise...").start();
          await delay(300); // Add delay
          spinner.stop();
          resolve(apiKey);
        }
      });
    }
  });
};

interface CommandOptions {
  message?: string;
  about?: boolean;
  dummy?: boolean;
  help?: boolean;
  h?: boolean;
  _: (string | number)[];
  $0: string;
}

// Use command handler function
const options = yargs(hideBin(process.argv))
  .parserConfiguration({
    "short-option-groups": false,
  })
  .command(
    "$0 [message]",
    "Your message",
    (yargs: Argv) => {
      yargs.positional("message", {
        describe: "Your message",
        type: "string",
      });
    },
    (argv: CommandOptions) => {
      handleArguments(argv);
    }
  )
  .option("about", {
    describe: "Show information about the author and this package",
    type: "boolean",
  })
  .option("dummy", {
    describe: "Use dummy data for testing",
    type: "boolean",
  })
  .option("help", {
    describe: "Show help information",
    type: "boolean",
  })
  .alias("h", "help")
  .alias("v", "version")
  .strict()
  .parse();

async function handleArguments(options: CommandOptions) {
  if (options.about) {
    console.log(
      "Author: Your Name\nThis package helps non-developers use git."
    );
    process.exit(0);
  }

  if (options.help) {
    console.log("Here is some help");
    process.exit(0);
  }

  if (!options.dummy && !options.message) {
    console.error(
      "Looks like you forgot to add a message. Run `margit -h` or `margit -help` if you need support"
    );
    process.exit(1);
  }

  const apiKey = await getApiKey();

  let spinner: { stop: () => void };

  if (!options.dummy) {
    spinner = ora("Communicating with GPT-4...").start();
  }
  const openaiEndpoint = "https://api.openai.com/v1/chat/completions";

  let branch = "";
  let status = "";
  let remoteUrl = "";

  try {
    // Check if this is a git repo
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch (error) {
    console.log(
      chalk.inverse(
        "\nLooks like this folder isn't a git repository yet.\nAsk `margit 'Set-up git repo'` if you need some guidance.\nOr simply run `git init`"
      )
    );
    console.error("");
    return; // exit the function
  }

  // If we're here, it's a git repo
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: "ignore" })
      ?.toString()
      ?.trim();
  } catch (error) {
    console.log(
      chalk.inverse(
        "\nThere is no branch created yet. You might want to create a branch by asking margit or by running `git checkout -b <branch-name>`"
      )
    );
    console.error("");
    return;
  }

  try {
    status = execSync("git status", { stdio: "ignore" })?.toString()?.trim();
  } catch (error) {
    console.log(
      chalk.inverse(
        "\nThere was a problem retrieving the status of your Git repository."
      )
    );
    console.error("");
    return;
  }

  try {
    remoteUrl = execSync("git config --get remote.origin.url", {
      stdio: "ignore",
    })
      ?.toString()
      ?.trim();
  } catch (error) {
    console.log(
      chalk.inverse(
        "\nThere is no remote URL set for this repository. You might want to add a remote by running `git remote add origin <your-remote-url>`"
      )
    );
    console.error("");
    return;
  }

  if (options.dummy) {
    console.log(chalk.bold("Command to run"));
    console.log("> git add .");
    console.log("> git commit -m 'Adds initial files {a}, {b}, {c}'");
    console.log("> git push origin main");
    console.log(chalk.bold("\nExplanation"));
    console.log("Lorem ipsum dolor sit amet.");
    console.log("");
    inquirer
      .prompt([
        {
          type: "list",
          name: "runCommand",
          message: "Do you want to run the command?",
          choices: ["Yes", "No"],
        },
      ])
      .then((answer) => {
        if (answer.runCommand === "Yes") {
          console.log("Running command...");
          // Simulate command running delay
          setTimeout(() => {
            console.log("Command finished running.");
          }, 2000);
        } else {
          console.log("\nNo worries. Shall we try again?");
        }
      });
  } else {
    axios
      .post(
        openaiEndpoint,
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant in a user's MacOS terminal, helping non-developers use git. Translate user's natural language into a git command (git_command_to_run), using best git practices. Generally expectation is use is looking to commit and push their work. If committing, use imperative/present tense for the message. If ever suggesting a new branch it should be un-nested and follow number-ticket-name (e.g. 1-initial-setup). Return in format: command: {git_command_to_run}\nreason: {explanation_for_command}. If user's intent is unclear, ask for more context: challenge: {reason_for_challenge}\nreason: {explanation}.",
            },
            {
              role: "system",
              content: `The current branch is '${branch}'. The current status is '${status}'. The remote origin URL is '${remoteUrl}'.`,
            },
            { role: "user", content: options.message },
            {
              role: "system",
              content:
                "Your response format should be command: {git_command_to_run}\nreason: {explanation_for_command}. If user's intent is unclear, ask for more context with format: challenge: {reason_for_challenge}\nreason: {explanation}.",
            },
          ],
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      )
      .then((response) => {
        spinner.stop();
        const data = response.data.choices[0].message.content;
        const commandMatch = data.match(/command: ([^\n]+)/);
        const reasonMatch = data.match(/reason: ([^\n]+)/);
        const challengeMatch = data.match(/challenge: ([^\n]+)/);

        const command = commandMatch
          ? commandMatch[1].trim()
          : "No command found";
        const commands = command.split("&&").map((c: string) => c.trim());
        const reason = reasonMatch ? reasonMatch[1].trim() : "No reason found";
        const challenge = challengeMatch ? challengeMatch[1].trim() : null;

        if (challenge) {
          console.log("\nChallenge\n", challenge);
        } else {
          console.log(chalk.bold("Command to run"));
          commands.forEach((command: any, index: any) => {
            console.log(`> ${command}`);
          });
          console.log("");
          console.log(chalk.bold("Explanation"));
          console.log(reason);
          console.log("");

          inquirer
            .prompt([
              {
                type: "list",
                name: "runCommand",
                message: "Do you want to run the command?",
                choices: ["Yes", "No"],
              },
            ])
            .then((answer) => {
              if (answer.runCommand === "Yes") {
                // Split the command into an array
                const commands = command
                  .split("&&")
                  .map((c: string) => c.trim());

                const symbols = ["→ ", "⋙ ", "⅏ ", "⇶ ", "⇢ ", "⇰ ", "► "];
                let index = 0;
                // Create a function to run the commands in sequence
                const runCommand = (cmd: string, index: number) => {
                  console.log(
                    chalk.inverse(
                      "Running " + symbols[index % symbols.length]
                    ) +
                      " " +
                      cmd
                  );
                  const process = exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                      console.log(chalk.red("error:") + error.message);
                      return;
                    }
                    if (stderr) {
                      console.log(`${stderr}`);
                      return;
                    }
                    console.log(`${stdout}`);

                    // Run the next command in the array
                    if (commands.length) {
                      runCommand(commands.shift(), index + 1);
                    }
                  });
                };

                // Start the process
                runCommand(commands.shift(), 0);
              } else {
                console.log("\nNo worries. Shall we try again?");
              }
            });
        }
      })
      .catch((error) => {
        spinner.stop();
        console.log("Error:", error.message);
        if (error.response) {
          console.log("Response Data:", error.response.data);
          console.log("Response Status:", error.response.status);
          console.log("Response Headers:", error.response.headers);
        } else if (error.request) {
          console.log("Request:", error.request);
        } else {
          console.log("Other Error", error.message);
        }
        console.log("Config:", error.config);
      });
  }
}
