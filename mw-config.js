module.exports = {
  MonitorSourceDirectory: './src',
  BuildCommands: ['npm run build'],
  DeployCommands: ['./deploy'],
  ignoreList: { 
    'node_modules': true, 
    '.DS_Store': true
  }
}