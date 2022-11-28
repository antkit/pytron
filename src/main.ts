import { app, BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import isDev from "electron-is-dev";
import * as path from "path";
import { PythonShell } from "python-shell";
import { spawn, ChildProcess } from "child_process";

const dRoot = path.join(app.getPath("home"), ".pytron");

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: isDev ? 1440 : 800,
  });

  if (isDev) {
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "../index.html"));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile("https://epic7.joyqoo.com");
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

// packages item supports both PyAutoGUI and PyAutoGUI==0.9.53
function initPythonEnvironment(packages: string[]) {
  // p1, check system python envrionment
  const p1: ChildProcess = spawn("python3", ["--version"]);
  p1.on("error", () => {
    console.log("error");
  }).on("exit", () => {
    console.log("exit");

    // p2, create virtual python environment
    const venv = path.join(dRoot, "pyenv");
    const p2 = spawn("python3", ["-m", "venv", venv]);
    p2.on("error", () => {
      console.log("error2");
    }).on("exit", () => {
      console.log("exit2");

      // p3, install dependencies to virtual environment
      // -I stands for --ignore-installed which will ignore the installed packages, overwriting them.
      const p3 = spawn(path.join(venv, "bin", "pip"), ["install", "-I", packages.join(" ")]);
      p3.on("error", () => {
        console.log("error3");
      }).on("exit", () => {
        console.log("exit3");

        // TODO write version file to dRoot, this file can identify success
      });
    });
  });
}

// TODO check and inits

// message: likes "easyocr,PyAutoGUI==0.9.53"
ipcMain.on("init", (_event: IpcMainEvent, message: string) => {
  console.log("-> init:", message);
  initPythonEnvironment(message.split(","));
});

ipcMain.on("runString", (_event: IpcMainEvent, code: string) => {
  console.log(code);
  const py = PythonShell.runString(
    code,
    { mode: "text", pythonPath: path.join(dRoot, "pyenv", "bin", "python") },
    (err) => {
      console.error(err);
    }
  );
  py.on("message", (m) => {
    console.log("message", m);
    try {
      const j = JSON.parse(m);
      console.log("json:", j);
    } catch {
      // ignore unprocessable messages
    }
  });
  // PythonShell.runString("x=1+1;print(x)", undefined, function (err, results) {
  //   console.log("received", message);
  //   if (err) throw err;
  //   console.log("finished", results);
  // });
});

ipcMain.on("run", (_event: IpcMainEvent, filepath: string) => {
  console.log(filepath);
  const py = PythonShell.run(
    "autopy/epic7/detect_window.py",
    { mode: "text", pythonPath: path.join(dRoot, "pyenv", "bin", "python") },
    (err) => {
      console.error(err);
    }
  );
  py.on("message", (m) => {
    console.log("message", m);
    try {
      const j = JSON.parse(m);
      console.log("json:", j);
    } catch {
      // ignore unprocessable messages
    }
  });
});
