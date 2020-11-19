const fs = require('fs-extra')
const path = require('path')
const execSync = require('child_process').execSync
let globalConfig = {}

const CURRENT_DIR = process.cwd()
process.chdir(CURRENT_DIR)

function getConfig(configFile) {
  const {
    MonitorSourceDirectory,
    BuildCommands,
    DeployCommands,
    ignoreList
  } = require(configFile)

  if (!MonitorSourceDirectory || MonitorSourceDirectory.length === 0 || !DeployCommands || DeployCommands.length === 0) {
    const noDirectoryMessage = 'No directory specified to monitor'
    const noDeployCommandsMessage = 'No commands specified to deploy'
    const specificErrorMessage = !MonitorSourceDirectory || MonitorSourceDirectory.length === 0 ? noDirectoryMessage : noDeployCommandsMessage
    throw new Error(`Invalid Config, ${specificErrorMessage}`)
  }

  return {
    MonitorSourceDirectory,
    BuildCommands,
    DeployCommands,
    ignoreList
  }
}

async function deployModule() {
  const {
    DeployCommands
  } = globalConfig
  try {
    if (DeployCommands && DeployCommands.length) {
      for (deployCommand of DeployCommands) {
        console.log(`Executing: ${deployCommand}`)
        const output = execSync(deployCommand, {
          encoding: 'utf-8'
        })

        if (output) {
          console.log(output)
          const outputString = output.toString('utf8')
          if (outputString.includes('Failed')) { // this could be a bit more robust
            console.error('Deployment failed.')
            return false
          }
        }

      }
    }
    return true

  } catch (e) {
    console.error('Could not deploy module')
    console.error(e)
    process.exit()
  }
}

function buildModule() {
  const {
    BuildCommands
  } = globalConfig
  if (BuildCommands && BuildCommands.length) {
    for (buildCommand in BuildCommands) {
      const output = execSync(buildCommand, {
        encoding: 'utf-8'
      })
      if (output) {
        console.log(output)
        const outputString = output.toString('utf8')
        if (outputString.includes('Failed')) { // this could be a bit more robust
          console.error('Build failed.')
          return false
        }
      }
    }
  }
  return true
}

async function buildAndDeploy() {
  try {
    if (buildModule()) {
      await deployModule()
    }

  } catch (err) {
    console.error(err)
  }
}

function walkTree(dir) {
  let results = {}
  const fileList = fs.readdirSync(dir)

  fileList.forEach(function (file) {
    if (globalConfig.ignoreList.includes(file) || file.startsWith('.')) return
    file = dir + '/' + file
    var stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = {
        ...results,
        ...walkTree(file)
      }
    } else {
      results[file] = Math.floor(stat.mtimeMs)
    }
  })

  return results
}

function checkForChanges(lastResults, results) {
  const lastResultKeys = Object.keys(lastResults)
  const resultKeys = Object.keys(results)

  if (lastResultKeys.length !== resultKeys.length) {
    return true
  }

  for (let key of resultKeys) {
    if (results[key] !== lastResults[key]) {
      return true
    }
  }

  for (let key of lastResultKeys) {
    if (lastResults[key] !== results[key]) {
      return true
    }
  }
}

const ingForMs = async (ms) => new Promise(r => setTimeout(r, ms))

async function scanForChanges(path, lastResults = {}) {

  let results = walkTree(path)
  if (checkForChanges(lastResults, results)) {

    await ingForMs(2000) // We're waiting here to kind of pick up any new changes.
    // and again... 
    results = walkTree(path) // get the current state to recurse on
    console.log('Deploying')
    buildAndDeploy()
  }

  setTimeout(() => scanForChanges(path, results), 2000)
}

function scan() {
  const args = process.argv.slice(2)
  let configFileName = args[args.length - 1]
  if (!configFileName) {
    configFileName = 'mw-config.js'
  }

  const configFilePath = path.join(process.cwd(), configFileName)
  console.log(`loading config file ${configFilePath}`)
  globalConfig = getConfig(configFilePath)

  console.log('Module Watcher Config:')
  console.log(globalConfig)

  console.log(`monitoring ${globalConfig.MonitorSourceDirectory}`)

  scanForChanges(globalConfig.MonitorSourceDirectory)
}

exports.scan = scan