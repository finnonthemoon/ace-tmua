# ACE TMUA React Native: Beginner Setup Guide

This guide explains how to download, run, and work on the ACE TMUA React Native app from a completely new computer. It assumes you have not installed Git, Node.js, npm, Expo, Android Studio, or Xcode before.

The app is built with:

- Expo SDK 57
- React Native
- Expo Router
- TypeScript
- npm

You do not need to install the old global `expo-cli` package. This project runs Expo through `npx`, which uses the correct project version.

## 1. Before you starts: the owner must publish the React Native work

The current working React Native port is on the `react-porting` Git branch and has local, uncommitted changes. A GitHub clone only contains committed and pushed files.

Before you clones the project, the project owner should:

1. Check the app still runs.
2. Commit all intended React Native files, including the new lesson components and assets.
3. Push the `react-porting` branch to GitHub.
4. Tell you whether to use `react-porting` or whether it has been merged into `master`.

The owner can check the current state from the outer repository folder:

```bash
cd /Users/finn/Documents/ace-tmua
git status
git branch --show-current
```

Do not commit passwords, API keys, `.env` secrets, generated build folders, or `node_modules`.

## 2. Choose how you want to run the app

There are four useful choices:

### Easiest: a physical phone with Expo Go

Use this first if possible. It avoids installing a full native simulator.

- Install **Expo Go** from the Apple App Store or Google Play Store.
- Put the computer and phone on the same Wi-Fi network.
- Start Expo on the computer.
- Scan the QR code with the phone.

On Android, scan from inside Expo Go. On iPhone, the normal Camera app can open the Expo link.

### Browser

This is useful for quick layout checks:

```bash
npm run web
```

The browser is not a perfect substitute for testing a real phone. Touch behavior, safe areas, fonts, and native components can differ.

### Android emulator

Works on Windows, macOS, and Linux, but requires Android Studio and more disk space.

### iOS Simulator

Only works on macOS and requires Xcode. Windows users cannot run Apple's iOS Simulator.

## 3. Install Git

Git downloads the repository and lets both collaborators share changes.

### macOS

Open Terminal and run:

```bash
git --version
```

If macOS offers to install Command Line Developer Tools, accept the installation. After it finishes, run the command again.

You can also install Git from:

https://git-scm.com/download/mac

### Windows

1. Download Git for Windows from https://git-scm.com/download/win.
2. Run the installer.
3. The default installer choices are suitable for most beginners.
4. Close and reopen PowerShell or Windows Terminal after installation.

### Confirm Git works

```bash
git --version
```

You should see a version number instead of a “command not found” message.

## 4. Create a GitHub account and get repository access

1. Create an account at https://github.com if needed.
2. Send the GitHub username to the repository owner.
3. If the repository is private, the owner must invite that account as a collaborator.
4. Accept the invitation from GitHub or email before cloning.

For a beginner, cloning over HTTPS is usually simpler than configuring SSH keys.

## 5. Install Node.js and npm

Node.js runs the Expo development tools. npm is installed automatically with Node.js.

Use an active **LTS** version of Node.js rather than an experimental or nightly version.

Download it from:

https://nodejs.org/en/download

### macOS

1. Download the macOS LTS installer.
2. Open the downloaded `.pkg` file.
3. Follow the installer.
4. Close and reopen Terminal.

### Windows

1. Download the Windows LTS installer.
2. Open the downloaded `.msi` file.
3. Keep the option to install npm enabled.
4. Finish the installer.
5. Close and reopen PowerShell or Windows Terminal.

### Confirm Node and npm work

```bash
node --version
npm --version
```

Both commands should print version numbers.

If either command is not found, restart the terminal first. If it still fails, reinstall Node.js and ensure it is added to the system PATH.

## 6. Optional but recommended: install Visual Studio Code

Download Visual Studio Code from:

https://code.visualstudio.com

Recommended extensions:

- ESLint
- Prettier (optional; agree on formatting rules before using format-on-save)
- GitHub Pull Requests and Issues (optional)

Visual Studio Code is an editor, not a replacement for Node.js, npm, or Git.

## 7. Clone the repository

Choose a normal development folder such as `Documents` or a dedicated `Projects` folder. Avoid cloud-synchronised folders if they cause file-watching problems.

### macOS

```bash
cd ~/Documents
git clone https://github.com/finnonthemoon/ace-tmua.git
cd ace-tmua
```

### Windows PowerShell

```powershell
cd $HOME\Documents
git clone https://github.com/finnonthemoon/ace-tmua.git
cd ace-tmua
```

If GitHub asks for authentication, sign in through the browser prompt. GitHub account passwords are not accepted as command-line Git passwords; use the browser sign-in flow or a personal access token if requested.

If cloning says “repository not found,” check:

- The URL is correct.
- The collaborator invitation was accepted.
- The signed-in GitHub account has access.

## 8. Check out the React Native branch

If the React Native work has not yet been merged into `main`, run:

```bash
git fetch origin
git switch react-porting
```

Confirm the branch:

```bash
git branch --show-current
```

It should print:

```text
react-porting
```

If the owner has merged the work into `main`, use:

```bash
git switch main
git pull
```

## 9. Enter the actual Expo project folder

This repository currently has an outer repository folder and an inner Expo application folder. The `package.json` used for the React Native app is inside the second `ace-tmua` folder.

From the outer repository folder, run:

```bash
cd ace-tmua
```

You are in the correct folder if this command displays `package.json`:

### macOS/Linux

```bash
ls
```

### Windows PowerShell

```powershell
dir
```

You should see files and folders including:

```text
app.json
package.json
package-lock.json
src
assets
```

The final folder path will look similar to:

```text
.../ace-tmua/ace-tmua
```

Most “package.json not found” errors happen because a command was run from the outer folder instead of this inner Expo folder.

## 10. Install the project dependencies

From the inner Expo folder, run:

```bash
npm install
```

This reads `package.json` and `package-lock.json`, then downloads the exact libraries the project needs into a local `node_modules` folder.

Important:

- Do not manually copy someone else's `node_modules` folder.
- Do not commit `node_modules` to Git.
- Do not install Expo globally.
- Warnings during installation are not always errors. Look at the final lines and the exit status.

For the most reproducible clean installation, especially in automated builds, use:

```bash
npm ci
```

`npm ci` requires the lockfile to match `package.json` and replaces the existing `node_modules` installation. For a first beginner setup, `npm install` is fine.

## 11. Check the project before starting it

Run the TypeScript check:

```bash
npx tsc --noEmit
```

No output normally means it passed.

Run the linter:

```bash
npm run lint
```

Run Expo's project diagnostic tool:

```bash
npx expo-doctor
```

If these report errors immediately after cloning, first confirm that:

- You are on the correct branch.
- The owner's latest changes were committed and pushed.
- You ran `npm install` in the inner Expo folder.
- You pulled the latest commit.

## 12. Start the Expo development server

Run:

```bash
npm start
```

This is equivalent to:

```bash
npx expo start
```

Keep that terminal window open. Expo will display a QR code and keyboard shortcuts.

Common shortcuts include:

- `w` — open the web version
- `a` — open Android
- `i` — open iOS Simulator on macOS
- `r` — reload the app
- `j` — open debugging tools when supported

Press `Ctrl+C` in the terminal when you want to stop Expo.

## 13. Run on a physical phone with Expo Go

1. Install Expo Go on the phone.
2. Connect the phone and computer to the same Wi-Fi.
3. Run `npm start` in the inner Expo folder.
4. Scan the QR code.
5. Wait while the JavaScript bundle loads.

If the phone cannot connect:

1. Confirm both devices are on the same network.
2. Turn off a VPN temporarily.
3. Allow Node.js/Expo through the computer firewall when prompted.
4. Avoid isolated guest Wi-Fi networks.
5. Try tunnel mode:

```bash
npx expo start --tunnel
```

Tunnel mode can be slower and may need an additional package download.

## 14. Run in a browser

Use:

```bash
npm run web
```

If the browser does not open automatically, use the local URL printed in the terminal.

Always test important interface changes on a phone as well. The browser can render fonts, safe areas, scrolling, and native controls differently.

## 15. Android emulator setup

Use the official Expo guide alongside these steps:

https://docs.expo.dev/workflow/android-studio-emulator/

High-level process:

1. Install Android Studio from https://developer.android.com/studio.
2. During installation, include the Android SDK, Android SDK Platform, and Android Virtual Device.
3. Open Android Studio.
4. Open Device Manager.
5. Create a virtual phone, such as a recent Pixel device.
6. Download a recommended Android system image.
7. Start the virtual device.
8. In the project terminal, run:

```bash
npm run android
```

If Expo cannot find the Android SDK, follow the official guide to configure `ANDROID_HOME` and add the platform tools to PATH. The exact folder differs between Windows, macOS, and Linux.

Android emulators use significant disk space and memory. A physical Android phone with Expo Go is usually easier for a first run.

## 16. iOS Simulator setup on macOS

Use the official Expo guide:

https://docs.expo.dev/workflow/ios-simulator/

High-level process:

1. Install Xcode from the Mac App Store.
2. Open Xcode once and accept its licence and additional component installation.
3. In Xcode settings, install an iOS Simulator runtime if required.
4. Return to the project terminal.
5. Run:

```bash
npm run ios
```

The first Xcode installation and simulator download can be large and take a while.

## 17. Open the project in Visual Studio Code

From the inner Expo folder:

```bash
code .
```

If `code` is not recognised, open Visual Studio Code normally and choose **File → Open Folder**, then select the inner `ace-tmua` folder containing `package.json`.

Important project locations:

```text
src/app/                 Expo Router pages
src/app/_layout.tsx      Bottom tab navigation
src/app/index.tsx        Home page
src/app/learn.tsx        Learn and topic roadmap
src/app/leaderboard.tsx  Leaderboard page
src/app/questions.tsx    Exam-practice placeholder
src/app/profile.tsx      Profile page
src/app/lesson/          Dynamic lesson route
src/components/lesson/   Reusable lesson screens and player
src/data/                Lessons, leaderboard, questions, and seed user data
src/constants/theme.ts   Shared colours and theme values
assets/                  App images and icons
```

Expo Router uses file-based routing. A file placed inside `src/app` becomes a route or part of the route layout. Reusable components should normally live in `src/components`, not directly in `src/app`.

## 18. Normal daily workflow for both collaborators

Before starting work:

```bash
git switch react-porting
git pull
npm install
```

`npm install` is especially important after pulling a change to `package.json` or `package-lock.json`.

Create a small branch for a new piece of work:

```bash
git switch -c your-name/short-description
```

Examples:

```text
sam/profile-editing
sam/leaderboard-filter
finn/lesson-progress-storage
```

While working:

```bash
npm start
```

Before committing:

```bash
npx tsc --noEmit
npm run lint
git status
git diff
```

Commit and push:

```bash
git add <files-you-intended-to-change>
git commit -m "Describe the change clearly"
git push -u origin your-name/short-description
```

Then open a pull request on GitHub so the other collaborator can review the change.

Avoid both people making large changes to the same file at the same time. Agree ownership of files or features before starting.

## 19. Getting someone else's latest changes

After a pull request is merged:

```bash
git switch react-porting
git pull
npm install
```

Then check the project:

```bash
npx tsc --noEmit
npm run lint
```

Restart Expo with a cleared cache if changes appear stale:

```bash
npx expo start --clear
```

## 20. Important Git safety rules

- Run `git status` frequently.
- Do not use `git reset --hard` unless you fully understand that it discards work.
- Do not force-push shared branches.
- Do not commit `node_modules`.
- Do commit intentional changes to `package-lock.json` when dependencies change.
- Pull before beginning new work.
- Use short feature branches and pull requests.
- Never put private API keys or passwords directly in source files.

## 21. Common errors and fixes

### `npm: command not found` or “npm is not recognized”

Node.js is missing or the terminal has not refreshed its PATH.

1. Install the Node.js LTS version.
2. Close all terminal windows.
3. Open a new terminal.
4. Run `node --version` and `npm --version`.

### `ENOENT: no such file or directory, open package.json`

You are in the wrong folder. Enter the inner Expo folder:

```bash
cd ace-tmua
```

Check that `package.json` is visible before running npm commands.

### `Cannot find module ...`

Install dependencies:

```bash
npm install
```

If the problem remains:

```bash
npx expo start --clear
```

### Expo opens an old version of the app

Stop Expo with `Ctrl+C`, then run:

```bash
npx expo start --clear
```

Also confirm the correct Git branch and latest commit:

```bash
git branch --show-current
git pull
```

### QR code opens but the phone cannot connect

- Put both devices on the same network.
- Disable VPNs temporarily.
- Check firewall permissions.
- Try `npx expo start --tunnel`.
- Try the browser to determine whether the app itself starts.

### Expo Go says the project SDK is unsupported

Update Expo Go from the phone's app store. If the problem continues, compare the Expo Go version with the project's Expo SDK version (`~57.0.4` in `package.json`) using the official Expo documentation.

### TypeScript shows errors that the owner does not see

```bash
git pull
npm install
npx tsc --noEmit
```

Confirm both collaborators are on the same branch and commit.

### Port already in use

Expo may offer another port. Accept it, or stop the other Expo terminal with `Ctrl+C`.

### Changes do not appear

1. Save the file.
2. Press `r` in the Expo terminal.
3. If necessary, restart with `npx expo start --clear`.

### Git reports a merge conflict

Do not guess or delete both versions. Open each conflicted file, decide which lines should remain, remove the conflict markers, run the checks, then commit the resolved files. Ask the other collaborator for help if both sets of changes are important.

## 22. Data currently used by the app

The app currently uses bundled JSON files:

- `src/data/lessons.json` — lesson definitions
- `src/data/leaderboard.json` — leaderboard seed users
- `src/data/localTestStorage.json` — profile seed data
- `src/data/questions.json` — question data

These files are packaged with the app. They are not yet a shared live database.

Consequences:

- Editing JSON changes the data after the app is rebuilt/reloaded.
- One user's changes are not automatically sent to another user.
- Profile changes are not currently saved permanently on the device.
- The leaderboard is not currently updated by an online service.

Later, the project can add device storage for local progress and a backend/API for accounts and a live leaderboard.

## 23. Quick-start checklist

After the owner has committed and pushed the React Native port, the shortest setup is:

```bash
git clone https://github.com/finnonthemoon/ace-tmua.git
cd ace-tmua
git switch react-porting
cd ace-tmua
npm install
npx tsc --noEmit
npm run lint
npm start
```

Then scan the QR code with Expo Go or press `w` for the browser.

## Official installation references

- Expo environment setup: https://docs.expo.dev/get-started/set-up-your-environment/
- Starting an Expo project: https://docs.expo.dev/get-started/start-developing/
- Expo Go: https://expo.dev/go
- Android emulator: https://docs.expo.dev/workflow/android-studio-emulator/
- iOS Simulator: https://docs.expo.dev/workflow/ios-simulator/
- Node.js downloads: https://nodejs.org/en/download
- Git downloads: https://git-scm.com/downloads
- Visual Studio Code: https://code.visualstudio.com

