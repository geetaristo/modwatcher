# modwatcher
watch an npm module and update local repos on file changes.

## Description
Have you ever worked on an npm module that is consumed by some of your other projects? There are a few existing mechanisms, symbolic linking, or git submodules or worse, publishing before you can fully test in the consuming projects. If you're working on the module and the consuming project at the same time, it can be really frustrating. This project works like nodemon or webpack in that it automatically detects your changes and will rebuild, if needed, and execute a deploy command. If your consuming project is using nodemon or webpack, it will also detect the node_module update and restart or rebuild the consuming project.

# Installation
npm i -g modwatcher

# Configuring
Create a JavaScript config file named mw-config.js in your node modules root directory like so:
```
module.exports = {
  MonitorSourceDirectory: './src',
  BuildCommands: [],
  DeployCommands: [
    'cp *.js ../myotherproject/node_modules/mynpm-module',
    'cp *.json ../myotherproject/node_modules/mynpm-module',
    'cp index.js ../myotherproject/node_modules/mynpm-module',
    'cp -R api ../myotherproject/node_modules/mynpm-module',
    'cp -R node_modules ../myotherproject/node_modules/mynpm-module',
    'cp -R src ../myotherproject/node_modules/mynpm-module'
  ],
  ignoreList: [
    'node_modules', '.DS_Store'
  ] 
}

```
* The `MonitorSourceDirectory` is where your source code changes are happening
* The `BuildCommands` is a list of build commands needed to execute before deploying
* The `DeployCommands` is a list of commands to update your other project's node module
* The `ignoreList` are directories or files to ignore when changes occur.

# Excuting
From your npm module's directory run:
`modwatcher mw-config.js`
The file `mw-config.js` is the default file name and so doesn't need to be passed in but if you want, you can override it with your own filename


