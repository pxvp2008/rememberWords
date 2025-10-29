#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取配置文件
const configPath = path.join(__dirname, '../config/app.json');
const packagePath = path.join(__dirname, '../package.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // 从配置文件获取app信息
  const appConfig = config.app;

  // 更新package.json中的信息
  packageJson.version = appConfig.version;

  // 更新electron-builder配置中的productName
  if (packageJson.build && packageJson.build.mac) {
    packageJson.build.productName = appConfig.name;
    packageJson.build.appId = `com.${appConfig.name.toLowerCase().replace(/\s+/g, '')}.app`;
  }

  // 更新DMG配置
  if (packageJson.build && packageJson.build.dmg) {
    packageJson.build.dmg.title = `${appConfig.name} ${appConfig.version}`;
  }

  // 写回package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

  console.log('✅ Build configuration updated from config/app.json');
  console.log(`   App Name: ${packageJson.build.productName}`);
  console.log(`   Version: ${appConfig.version}`);
  console.log(`   App ID: ${packageJson.build.appId}`);

} catch (error) {
  console.error('❌ Error updating build configuration:', error.message);
  process.exit(1);
}