# ACE TMUA: Windows + iPhone Development Setup

This guide gets the ACE TMUA React Native project running on a Windows computer and an iPhone so development can begin.

It assumes the following are already installed and working:

- Git
- A GitHub account with access to the repository
- Visual Studio Code

The only additional software needed for the basic setup is:

- Node.js and npm on Windows
- Expo Go on the iPhone

React, React Native, Expo, Expo Router, TypeScript, and the other project libraries are installed automatically from the repository. They do not need to be installed separately or globally.

## 1. Install Node.js and npm

Node.js runs the JavaScript and Expo development tools. npm downloads the packages used by the project.

1. Open https://nodejs.org/en/download.
2. Download the Windows installer for the current **LTS** version.
3. Open the downloaded `.msi` file.
4. Keep the default installation options.
5. Make sure npm and the option to add Node.js to PATH remain enabled.
6. Finish the installation.
7. Close every PowerShell, Command Prompt, Windows Terminal, and Visual Studio Code window.
8. Open a new PowerShell window.

Check the installation:

```powershell
node --version
npm --version
```

Both commands should print version numbers.

If either command is not recognised:

1. Close and reopen PowerShell.
2. Restart Windows if necessary.
3. If it still does not work, reinstall the Node.js LTS version and ensure the PATH option is enabled.

Do not install the old global `expo-cli` package. This project uses its own Expo version through `npx` and npm scripts.

## 2. Install Expo Go on the iPhone

1. Open the App Store on the iPhone.
2. Search for **Expo Go**.
3. Check that the publisher is Expo.
4. Install the app.
5. Allow local-network access if iOS asks for permission when the project is opened later.

Expo Go runs the development version of the app without needing Xcode or a Mac.

## 3. Open and update the existing project

The repository has already been cloned. Open PowerShell and enter the outer repository folder. Replace the example path with the location where the project was cloned:

```powershell
cd C:\path\to\ace-tmua
```

Make sure the shared `master` branch is selected and download the latest work:

```powershell
git switch master
git pull
```

Confirm the branch:

```powershell
git branch --show-current
```

It should print `master`.

## 4. Enter the Expo project folder

The repository has an outer folder and a second `ace-tmua` folder containing the React Native app.

Enter the inner app folder:

```powershell
cd ace-tmua
```

The path should now look similar to:

```text
C:\Users\YourName\Documents\Projects\ace-tmua\ace-tmua
```

Check the folder:

```powershell
dir
```

It should contain:

```text
app.json
package.json
package-lock.json
src
assets
```

All npm and Expo commands must be run from this inner folder. If npm says it cannot find `package.json`, the terminal is in the wrong folder.

## 5. Install React, Expo, and the project dependencies

Run:

```powershell
npm install
```

This command reads `package.json` and installs everything the app needs, including:

- React
- React Native
- Expo
- Expo Router
- TypeScript
- React Navigation
- Icons
- Safe-area support
- SVG and HTML rendering packages

The packages are placed in a generated `node_modules` folder.

Important:

- Do not install React or Expo separately.
- Do not run `npm install -g expo-cli`.
- Do not copy `node_modules` from another computer.
- Do not commit `node_modules` to Git.
- Keep `package-lock.json` because it helps both developers use compatible package versions.

The first installation may take several minutes.

## 6. Verify the project

Run the TypeScript check:

```powershell
npx tsc --noEmit
```

No output normally means it passed.

Run the code-quality check:

```powershell
npm run lint
```

Optionally run Expo's diagnostic check:

```powershell
npx expo-doctor
```

If TypeScript or lint reports errors immediately after cloning:

```powershell
git pull
npm install
npx tsc --noEmit
npm run lint
```

Also confirm that the `master` branch is selected.

## 7. Start the app

Run:

```powershell
npm start
```

This starts the Expo development server. It is equivalent to:

```powershell
npx expo start
```

Keep the PowerShell window open while developing. The terminal will show a QR code.

Useful keyboard shortcuts in the Expo terminal:

- `w` opens the web version.
- `r` reloads the app.
- `j` opens debugging tools when available.
- `Ctrl+C` stops the server.

Windows cannot run the iOS Simulator, but the physical iPhone can run the project through Expo Go.

## 8. Open the app on the iPhone

1. Connect the Windows computer and iPhone to the same Wi-Fi network.
2. Make sure Expo is running with `npm start`.
3. Open the normal Camera app on the iPhone.
4. Point it at the QR code in PowerShell.
5. Tap the notification that appears.
6. Allow the link to open in Expo Go.
7. Allow local-network access if iOS requests it.
8. Wait for the project to build and load.

The first load can take longer because Expo has to create the JavaScript bundle.

## 9. If the iPhone cannot connect

Try these steps in order:

1. Confirm the computer and iPhone are on the same Wi-Fi network.
2. Avoid guest Wi-Fi, which may prevent devices from communicating.
3. Disable VPN software on both devices temporarily.
4. When Windows Firewall asks about Node.js, allow access on private networks.
5. Stop Expo with `Ctrl+C` and restart it with a cleared cache:

```powershell
npx expo start --clear
```

6. If the network still blocks the connection, try tunnel mode:

```powershell
npx expo start --tunnel
```

Tunnel mode may be slower and may ask to install an additional package.

If Expo Go reports that the SDK is unsupported, update Expo Go from the App Store. The project currently uses Expo SDK 57.

## 10. Open the code in Visual Studio Code

From the inner Expo project folder, run:

```powershell
code .
```

If `code` is not recognised:

1. Open Visual Studio Code normally.
2. Select **File → Open Folder**.
3. Open the inner `ace-tmua` folder containing `package.json`.

Recommended Visual Studio Code extension:

- ESLint

Prettier is optional. Avoid enabling automatic formatting across the whole project unless both developers agree on the formatting setup.

## 11. Understand the main project folders

```text
src/app/                 Expo Router pages
src/app/_layout.tsx      Bottom navigation
src/app/index.tsx        Home page
src/app/learn.tsx        Learn page and topic roadmaps
src/app/leaderboard.tsx  Leaderboard page
src/app/questions.tsx    Exam-practice placeholder
src/app/profile.tsx      Profile page
src/app/lesson/          Dynamic lesson route
src/components/lesson/   Reusable lesson components
src/data/                Lessons, leaderboard, questions, and profile data
src/constants/theme.ts   Shared colours and theme values
assets/                  Images and app icons
```

Expo Router uses file-based routing. Files inside `src/app` become pages or layouts. Reusable components should normally go in `src/components`.

## 12. Normal development routine

At the start of a session, open PowerShell and enter the project:

```powershell
cd $HOME\Documents\Projects\ace-tmua\ace-tmua
```

Update the shared branch:

```powershell
git switch master
git pull
npm install
```

Create a branch for the new work:

```powershell
git switch -c leo/short-description
```

Examples:

```text
leo/profile-editing
leo/lesson-progress
leo/question-screen
```

Start Expo:

```powershell
npm start
```

Edit files in Visual Studio Code. Expo should automatically reload the app after a file is saved. Press `r` in the Expo terminal if a manual reload is needed.

## 13. Check and share changes

Before committing:

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

Commit:

```powershell
git commit -m "Describe the change clearly"
```

Push the feature branch:

```powershell
git push -u origin leo/short-description
```

Open a pull request on GitHub so the changes can be reviewed before they are merged.

Do not commit:

- `node_modules`
- Passwords
- API keys
- Private `.env` values
- Generated build files

## 14. Pull newly merged work

After changes have been merged into the shared branch:

```powershell
git switch master
git pull
npm install
npx tsc --noEmit
npm run lint
```

Restart Expo if it was already running:

```powershell
npx expo start --clear
```

## 15. Common setup problems

### `npm` is not recognised

Node.js is missing or Windows has not refreshed PATH. Reinstall Node.js LTS, close all terminals, and open PowerShell again.

### npm cannot find `package.json`

The terminal is in the outer repository folder. Run:

```powershell
cd ace-tmua
dir
```

Confirm that `package.json` appears.

### `Cannot find module ...`

Run:

```powershell
npm install
npx expo start --clear
```

### Expo displays an old version

Run:

```powershell
git pull
npm install
npx expo start --clear
```

### Saved changes do not appear

Save the file, press `r` in the Expo terminal, or restart Expo with `npx expo start --clear`.

### A port is already in use

Accept the alternative port offered by Expo or stop the other development server with `Ctrl+C`.

### Git reports a merge conflict

Open each conflicted file in Visual Studio Code, decide which changes should remain, remove the conflict markers, run TypeScript and lint, and then commit the resolution. Do not automatically delete both versions.

## Quick-start commands

After Node.js and Expo Go are installed, open PowerShell and replace the example path with the existing clone location:

```powershell
cd C:\path\to\ace-tmua
git switch master
git pull
cd ace-tmua
npm install
npx tsc --noEmit
npm run lint
npm start
```

Then scan the QR code with the iPhone Camera app and open it in Expo Go.

## Official references

- Node.js LTS: https://nodejs.org/en/download
- Expo Go: https://expo.dev/go
- Expo environment setup: https://docs.expo.dev/get-started/set-up-your-environment/
- Start developing with Expo: https://docs.expo.dev/get-started/start-developing/
