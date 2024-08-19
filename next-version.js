require('dotenv').config();

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const semver = require('semver')
const packageJsonPath = path.join(__dirname, './package.json')
const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8')
const packageJson = JSON.parse(packageJsonData)

let version = packageJson.version
const releaseType = process.env.REACT_APP_RELEASE_TYPE
const semverType = process.env.REACT_APP_SEMVER_TYPE

const bumpVersion = (version) => {
  try {
    execSync(`npm version ${version}`, { stdio: 'inherit' })
    console.log('Dtworks version updated to:', version)
  } catch (error) {
    console.error('Failed to execute npm version:', error)
    process.exit(1)
  }
}

if (process.env.REACT_APP_VERSION_BUMP) {
  if (releaseType === 'alpha' || releaseType === 'beta') {
    if (semverType === 'prerelease') {
      version = semver.inc(version, 'prerelease')
    } else if (semverType === 'prepatch') {
      version = semver.inc(version, 'prepatch', releaseType)
    } else {
      console.error('Missing semver type. Expected "prerelease", "prepatch".')
      process.exit(1)
    }
  } else if (releaseType === 'stable') {
    if (!semverType) {
      console.error('Missing semver type. Expected "patch", "minor" or "major".')
      process.exit(1)
    }
    version = semver.inc(version, semverType)
  }
  else {
    console.error('Invalid release type. Expected "beta" or "stable".')
    process.exit(1)
  }
  bumpVersion(version)
} else {
  console.log('Dry run. Skipping version bump. Current Version:', version)
  process.exit(0)
}

