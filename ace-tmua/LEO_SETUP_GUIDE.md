# ACE TMUA React Native: Windows Setup Guide

This guide explains how to download, run, and contribute to the ACE TMUA React Native app on Windows. It assumes Git is already installed and the GitHub account being used has access to the repository.

The app uses Expo SDK 57, React Native, Expo Router, TypeScript, and npm. Do not install the old global `expo-cli` package; use the project's Expo version through `npx` or the npm scripts below.

## 1. Install Node.js and npm

Node.js runs Expo's development tools. npm is installed with Node.js.

1. Visit https://nodejs.org/en/download.
2. Download the Windows installer for the current **LTS** release.
3. Open the `.msi` installer.
4. Keep the default components, including npm and the option to add Node.js to PATH.
5. Finish the installation.
6. Close every PowerShell, Command Prompt, and Windows Terminal window.
7. Open a new PowerShell window.

Check the installation:

```powershell
node --version
npm --version
```

Both commands should print version numbers. If either command is not recognised, restart the terminal or Windows. If it remains unavailable, reinstall Node.js and ensure the PATH option is enabled.

## 2. Install Visual Studio Code

Download Visual Studio Code from https://code.visualstudio.com.

Useful installer options include:

- Add “Open with Code” to Windows Explorer.
- Add Visual Studio Code to PATH.
- Register Visual Studio Code as an editor for supported file types.

Recommended extensions:

- ESLint
- Prettier (optional)
- GitHub Pull Requests and Issues (optional)

Visual Studio Code is the editor; it does not replace Node.js, npm, or Git.

## 3. Clone the repository

Avoid keeping the project inside OneDrive if possible because cloud synchronisation can interfere with file watching and dependency folders.

Create a project directory:

```powershell
cd $HOME\Documents
mkdir Projects -ErrorAction SilentlyContinue
cd Projects
```

Clone the repository over HTTPS:

```powershell
git clone https://github.com/finnonthemoon/ace-tmua.git
cd ace-tmua
```

Complete the GitHub browser sign-in prompt if requested. If Git reports “repository not found,” confirm that the GitHub account has repository access and that any invitation has been accepted.

## 4. Select the React Native branch

The React Native work currently uses the `react-porting` branch:

```powershell
git fetch origin
git switch react-porting
git branch --show-current
```

The final command should print:

```text
react-porting
```

If this work is later merged into `main`, use `git switch main` followed by `git pull` instead.

## 5. Enter the Expo project folder

The repository contains an outer repository folder and an inner Expo app folder. Enter the inner folder:

```powershell
cd ace-tmua
```

The path should resemble:

```text
C:\Users\YourName\Documents\Projects\ace-tmua\ace-tmua
```

Check its contents:

```powershell
dir
```

The folder should contain `package.json`, `package-lock.json`, `app.json`, `src`, and `assets`. All npm, Expo, TypeScript, and lint commands must run from this inner folder.

## 6. Install dependencies

Run:

```powershell
npm install
```

This downloads the packages declared in `package.json` and creates `node_modules`.

Important rules:

- Do not copy `node_modules` from another computer.
- Do not commit `node_modules` to Git.
- Do not install Expo globally.
- Do commit intentional `package-lock.json` changes when dependencies change.

For a clean lockfile-controlled reinstall, use `npm ci`. This removes the existing `node_modules` folder before reinstalling exact locked versions.

## 7. Verify the project

Run all three checks:

```powershell
npx tsc --noEmit
npm run lint
npx expo-doctor
```

No TypeScript output normally means it passed. If checks fail immediately after cloning, confirm the branch, pull again, and reinstall dependencies:

```powershell
git branch --show-current
git pull
npm install
```

## 8. Install Expo Go on a phone

The easiest first run is on a physical phone.

1. Install **Expo Go** from Google Play or the Apple App Store.
2. Connect the phone and Windows computer to the same Wi-Fi network.
3. On Android, scan the development QR code inside Expo Go.
4. On iPhone, scan it with the normal Camera app.

## 9. Start the app

From the inner Expo folder, run:

```powershell
npm start
```

This is equivalent to `npx expo start`. Keep the terminal open while developing.

Common shortcuts:

- `w` opens the web version.
- `a` opens an installed Android emulator.
- `r` reloads the app.
- `j` opens debugging tools when supported.
- `Ctrl+C` stops Expo.

To run directly in a browser:

```powershell
npm run web
```

The browser is useful for quick checks, but important changes should also be tested on a phone because safe areas, touch input, scrolling, and native controls may differ.

## 10. Connect a physical phone

1. Start Expo with `npm start`.
2. Scan the QR code.
3. Allow Expo Go to open the project.
4. Wait for the JavaScript bundle to build.

If Windows Firewall asks whether Node.js may communicate on the network, allow private-network access.

If the phone cannot connect:

- Confirm both devices use the same Wi-Fi.
- Disable VPN software temporarily.
- Avoid isolated guest Wi-Fi.
- Check Node.js permissions in Windows Firewall.
- Restart with `npx expo start --clear`.
- If necessary, try `npx expo start --tunnel`.

Tunnel mode may be slower and may request an additional package installation.

## 11. Optional Android emulator

Follow the official guide at https://docs.expo.dev/workflow/android-studio-emulator/.

General process:

1. Install Android Studio from https://developer.android.com/studio.
2. Include the Android SDK, Android SDK Platform, and Android Virtual Device.
3. Open Android Studio and complete its first-run downloads.
4. Open Device Manager.
5. Create a recent Pixel virtual device.
6. Download a recommended Android system image.
7. Start the virtual device.
8. From the project folder, run `npm run android` or start Expo and press `a`.

If Expo cannot locate the SDK, follow the official guide to configure `ANDROID_HOME` and add Android platform tools to PATH.

Windows cannot run Apple's iOS Simulator. A physical iPhone can still use Expo Go.

## 12. Open the project in Visual Studio Code

From the inner project folder:

```powershell
code .
```

If `code` is not recognised, open Visual Studio Code, select **File → Open Folder**, and choose the inner `ace-tmua` folder containing `package.json`.

Important locations:

```text
src/app/                 Expo Router pages
src/app/_layout.tsx      Bottom navigation
src/app/index.tsx        Home page
src/app/learn.tsx        Learn page and roadmaps
src/app/leaderboard.tsx  Leaderboard page
src/app/questions.tsx    Exam-practice placeholder
src/app/profile.tsx      Profile page
src/app/lesson/          Dynamic lesson route
src/components/lesson/   Reusable lesson screens
src/data/                Lessons, leaderboard, questions, and profile data
src/constants/theme.ts   Shared colours and theme values
assets/                  Images and icons
```

Expo Router uses file-based routing. Files inside `src/app` become routes or route layouts. Reusable components should normally be placed in `src/components`.

## 13. Everyday workflow

Open PowerShell and enter the inner project folder:

```powershell
cd $HOME\Documents\Projects\ace-tmua\ace-tmua
```

Update the shared branch:

```powershell
git switch react-porting
git pull
npm install
```

Create a branch for new work:

```powershell
git switch -c your-name/short-description
```

Example branch names:

```text
leo/profile-editing
leo/leaderboard-filter
leo/question-screen
```

Start development with `npm start`.

Before committing, run:

```powershell
npx tsc --noEmit
npm run lint
git status
git diff
```

Stage only intended files:

```powershell
git add path\to\file
```

Commit and push:

```powershell
git commit -m "Describe the change clearly"
git push -u origin your-name/short-description
```

Open a pull request on GitHub for review before merging.

## 14. Pull newly merged work

After changes are merged:

```powershell
git switch react-porting
git pull
npm install
npx tsc --noEmit
npm run lint
```

If Expo was already running, restart it with:

```powershell
npx expo start --clear
```

## 15. Git safety

- Run `git status` frequently.
- Pull before beginning new work.
- Use focused feature branches and pull requests.
- Avoid simultaneous large edits to the same file.
- Never commit `node_modules`, API keys, passwords, or secrets.
- Commit intentional lockfile changes when dependencies change.
- Do not force-push shared branches.
- Do not run `git reset --hard` unless discarding local work is intentional and understood.

## 16. Common problems

### npm is not recognised

Install Node.js LTS, close all terminals, open a new PowerShell window, and retry `node --version` and `npm --version`.

### npm cannot find `package.json`

The terminal is in the wrong folder. Enter the inner app folder with `cd ace-tmua`, then use `dir` to confirm `package.json` exists.

### Cannot find a module

```powershell
npm install
npx expo start --clear
```

### Expo shows an old version

```powershell
git pull
npm install
npx expo start --clear
```

Also confirm the branch with `git branch --show-current`.

### Expo Go reports an unsupported SDK

Update Expo Go from the phone's app store. The project currently uses Expo SDK 57 (`~57.0.4` in `package.json`).

### A port is already in use

Accept Expo's alternative port or stop the other server with `Ctrl+C`.

### Saved changes do not appear

Save the file, press `r` in the Expo terminal, or restart with `npx expo start --clear`.

### Git reports a merge conflict

Open each conflicted file, decide which changes should remain, remove the conflict markers, run TypeScript and lint, then commit the resolution. Do not automatically delete both versions.

## 17. Current data limitations

The app currently reads bundled JSON files:

- `src/data/lessons.json`
- `src/data/leaderboard.json`
- `src/data/localTestStorage.json`
- `src/data/questions.json`

These are not a live database. Editing them changes bundled app data, but user changes are not automatically synchronised or permanently stored. Device storage can later handle local progress; a backend will be needed for accounts and a shared live leaderboard.

## 18. Quick start

After installing Node.js, open PowerShell and run:

```powershell
cd $HOME\Documents
mkdir Projects -ErrorAction SilentlyContinue
cd Projects
git clone https://github.com/finnonthemoon/ace-tmua.git
cd ace-tmua
git fetch origin
git switch react-porting
cd ace-tmua
npm install
npx tsc --noEmit
npm run lint
npm start
```

Scan the QR code with Expo Go or press `w` for the browser.

## Official references

- Node.js: https://nodejs.org/en/download
- Visual Studio Code: https://code.visualstudio.com
- Expo setup: https://docs.expo.dev/get-started/set-up-your-environment/
- Starting Expo: https://docs.expo.dev/get-started/start-developing/
- Expo Go: https://expo.dev/go
- Android emulator: https://docs.expo.dev/workflow/android-studio-emulator/
- Android Studio: https://developer.android.com/studio
