#!/usr/bin/env node
/**
 * Copy frontend build and documentation to docs folder for GitHub Pages deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const distDir = path.join(rootDir, 'frontend', 'dist');
const docsSourceDir = path.join(rootDir, 'documentation');

console.log('Copying files to docs folder for GitHub Pages...\n');

// Clean docs folder
console.log('Cleaning docs folder...');
if (fs.existsSync(docsDir)) {
  execSync(`rm -rf "${docsDir}"/*`);
}

// Copy frontend build
console.log('Copying frontend build...');
if (!fs.existsSync(distDir)) {
  console.error('❌ Frontend dist folder not found. Run "npm run build" first.');
  process.exit(1);
}
execSync(`cp -r "${distDir}"/* "${docsDir}"/`);

// Create docs subdirectory
console.log('Creating documentation directory...');
const docsSubDir = path.join(docsDir, 'docs');
if (!fs.existsSync(docsSubDir)) {
  fs.mkdirSync(docsSubDir, { recursive: true });
}

// Copy documentation files
console.log('Copying documentation files...');
if (fs.existsSync(docsSourceDir)) {
  const docFiles = fs.readdirSync(docsSourceDir).filter(f => f.endsWith('.md'));
  docFiles.forEach(file => {
    execSync(`cp "${path.join(docsSourceDir, file)}" "${docsSubDir}/"`);
  });
  console.log(`Copied ${docFiles.length} documentation files`);
}

// Create GitHub Pages configuration files
console.log('Creating GitHub Pages configuration...');

// Create _config.yml for Jekyll
const configContent = `# GitHub Pages Configuration
title: BioPath
description: Chemical-Target-Pathway Analysis Framework
remote_theme: jekyll/minima

# Exclude from processing
exclude:
  - node_modules/
`;
fs.writeFileSync(path.join(docsDir, '_config.yml'), configContent);
console.log('Created _config.yml');

// Create 404.html for SPA routing
const notFoundContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>BioPath</title>
    <script>
      var path = window.location.pathname;
      if (path !== '/BioPath/' && !path.includes('.')) {
        sessionStorage.redirect = path;
        window.location.href = '/BioPath/';
      }
    </script>
  </head>
  <body></body>
</html>`;
fs.writeFileSync(path.join(docsDir, '404.html'), notFoundContent);
console.log('Created 404.html for SPA routing');

console.log('\nSuccessfully prepared docs folder for GitHub Pages deployment');
console.log('Deployment location: /docs folder');
console.log('Site will be available at: https://contactdharsan-blip.github.io/BioPath/');
console.log('\nNext steps:');
console.log('1. Commit changes: git add docs/ && git commit -m "Deploy to GitHub Pages"');
console.log('2. Push to main: git push origin main');
console.log('3. GitHub Pages will automatically deploy from the docs/ folder');
