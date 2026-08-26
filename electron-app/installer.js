const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const extractZip = require('extract-zip');

const GITHUB_REPO = 'bassy1992/cctv-sulellance-software';
const PYTHON_VERSION = '3.11.0';

/**
 * Download file from URL
 */
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, dest, onProgress)
          .then(resolve)
          .catch(reject);
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (onProgress && totalSize) {
          const percent = Math.round((downloadedSize / totalSize) * 100);
          onProgress(percent);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

/**
 * Execute command and return promise
 */
function execCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { 
      cwd, 
      shell: true,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    proc.on('error', reject);
  });
}

/**
 * Check if Python is installed
 */
async function checkPython() {
  try {
    const result = await execCommand('python', ['--version']);
    return result.stdout.includes('Python 3');
  } catch (error) {
    return false;
  }
}

/**
 * Check if Node.js is installed
 */
async function checkNode() {
  try {
    const result = await execCommand('node', ['--version']);
    return result.stdout.includes('v');
  } catch (error) {
    return false;
  }
}

/**
 * Download and extract repository from GitHub
 */
async function downloadRepository(installPath, progressCallback) {
  progressCallback({ message: 'Downloading from GitHub...', percent: 10 });
  
  const zipUrl = `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.zip`;
  const zipPath = path.join(installPath, 'repo.zip');
  
  await downloadFile(zipUrl, zipPath, (percent) => {
    progressCallback({ 
      message: `Downloading repository... ${percent}%`, 
      percent: 10 + Math.round(percent * 0.3) 
    });
  });
  
  progressCallback({ message: 'Extracting files...', percent: 40 });
  
  await extractZip(zipPath, { dir: installPath });
  
  // Move files from extracted folder
  const extractedFolder = path.join(installPath, 'cctv-sulellance-software-main');
  if (fs.existsSync(extractedFolder)) {
    const files = fs.readdirSync(extractedFolder);
    for (const file of files) {
      const srcPath = path.join(extractedFolder, file);
      const destPath = path.join(installPath, file);
      fs.renameSync(srcPath, destPath);
    }
    fs.rmdirSync(extractedFolder);
  }
  
  // Clean up
  fs.unlinkSync(zipPath);
  
  progressCallback({ message: 'Repository downloaded', percent: 50 });
}

/**
 * Setup Python virtual environment and install dependencies
 */
async function setupBackend(installPath, progressCallback) {
  const backendPath = path.join(installPath, 'backend');
  
  progressCallback({ message: 'Setting up Python environment...', percent: 50 });
  
  // Create virtual environment
  await execCommand('python', ['-m', 'venv', 'venv'], backendPath);
  
  progressCallback({ message: 'Installing Python packages...', percent: 60 });
  
  const pipExe = path.join(backendPath, 'venv', 'Scripts', 'pip.exe');
  
  // Upgrade pip
  await execCommand(pipExe, ['install', '--upgrade', 'pip']);
  
  // Install requirements
  const requirementsPath = path.join(backendPath, 'requirements.txt');
  await execCommand(pipExe, ['install', '-r', requirementsPath]);
  
  progressCallback({ message: 'Running database migrations...', percent: 70 });
  
  // Run migrations
  const pythonExe = path.join(backendPath, 'venv', 'Scripts', 'python.exe');
  const managePy = path.join(backendPath, 'manage.py');
  await execCommand(pythonExe, [managePy, 'migrate'], backendPath);
  
  progressCallback({ message: 'Backend setup complete', percent: 75 });
}

/**
 * Setup Node.js frontend and install dependencies
 */
async function setupFrontend(installPath, progressCallback) {
  const frontendPath = path.join(installPath, 'frontend');
  
  progressCallback({ message: 'Installing Node.js packages...', percent: 75 });
  
  // Install npm dependencies
  await execCommand('npm', ['install'], frontendPath);
  
  progressCallback({ message: 'Building frontend...', percent: 85 });
  
  // Build frontend
  await execCommand('npm', ['run', 'build'], frontendPath);
  
  progressCallback({ message: 'Frontend setup complete', percent: 90 });
}

/**
 * Check and install FFmpeg if needed
 */
async function checkFFmpeg(progressCallback) {
  progressCallback({ message: 'Checking FFmpeg...', percent: 90 });
  
  try {
    await execCommand('ffmpeg', ['-version']);
    progressCallback({ message: 'FFmpeg found', percent: 95 });
  } catch (error) {
    progressCallback({ 
      message: 'FFmpeg not found. Please install FFmpeg manually.', 
      percent: 95 
    });
  }
}

/**
 * Main installation function
 */
async function install(installPath, progressCallback = () => {}) {
  try {
    progressCallback({ message: 'Starting installation...', percent: 0 });
    
    // Ensure install directory exists
    if (!fs.existsSync(installPath)) {
      fs.mkdirSync(installPath, { recursive: true });
    }
    
    // Check prerequisites
    progressCallback({ message: 'Checking prerequisites...', percent: 5 });
    
    const hasPython = await checkPython();
    if (!hasPython) {
      throw new Error('Python 3 is not installed. Please install Python 3.10 or higher.');
    }
    
    const hasNode = await checkNode();
    if (!hasNode) {
      throw new Error('Node.js is not installed. Please install Node.js 18 or higher.');
    }
    
    // Download repository
    await downloadRepository(installPath, progressCallback);
    
    // Setup backend
    await setupBackend(installPath, progressCallback);
    
    // Setup frontend
    await setupFrontend(installPath, progressCallback);
    
    // Check FFmpeg
    await checkFFmpeg(progressCallback);
    
    progressCallback({ message: 'Installation complete!', percent: 100 });
    
    return { success: true };
    
  } catch (error) {
    progressCallback({ 
      message: `Installation failed: ${error.message}`, 
      percent: -1,
      error: true 
    });
    throw error;
  }
}

/**
 * Update installation from GitHub
 */
async function update(installPath, progressCallback = () => {}) {
  try {
    progressCallback({ message: 'Starting update...', percent: 0 });
    
    // Backup current installation
    const backupPath = installPath + '.backup';
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true });
    }
    
    progressCallback({ message: 'Creating backup...', percent: 10 });
    fs.renameSync(installPath, backupPath);
    
    // Fresh install
    await install(installPath, (progress) => {
      progressCallback({
        message: progress.message,
        percent: 10 + Math.round(progress.percent * 0.9)
      });
    });
    
    // Remove backup on success
    fs.rmSync(backupPath, { recursive: true });
    
    progressCallback({ message: 'Update complete!', percent: 100 });
    
    return { success: true };
    
  } catch (error) {
    // Restore backup on failure
    if (fs.existsSync(installPath + '.backup')) {
      if (fs.existsSync(installPath)) {
        fs.rmSync(installPath, { recursive: true });
      }
      fs.renameSync(installPath + '.backup', installPath);
    }
    
    progressCallback({ 
      message: `Update failed: ${error.message}`, 
      percent: -1,
      error: true 
    });
    throw error;
  }
}

module.exports = {
  install,
  update
};
