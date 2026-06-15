## 1. OPEN library
-- Thought opening a tab would be easy - turns out that is the hardest part of the entire project (not literally) - but yes, library just doesnt seem to work for me
-- instead making use of exec function from child_process (inbuilt node library) - helps execute shell commands
## Idea - Exec
Switch shell commands based on process.platform.



## 2.File/Directory check and creation.
The Issue: fs.mkdirSync(configDir) will throw an ENOENT error and crash your CLI if the parent directory (~/.config) doesn't exist yet. While most macOS and Linux machines have a ~/.config folder by default, a brand new machine, an automated testing environment, or a Windows machine running your CLI will not have it.

The Fix: Always pass { recursive: true } inside fs.mkdirSync. This tells Node to safely build out any missing parent folders down the line without crashing.

JavaScript
fs.mkdirSync(configDir, { recursive: true }); - To make sure the parent folders if not present to be generated as well.