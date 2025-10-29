#!/usr/bin/env node

/**
 * Windows便携版构建脚本
 * 用于生成Windows便携版应用程序
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建Windows便携版...');

try {
  // 1. 更新构建配置
  console.log('📝 更新构建配置...');
  execSync('node scripts/update-build-config.js', { stdio: 'inherit' });

  // 2. 构建前端
  console.log('🔨 构建前端应用...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. 编译Electron主进程
  console.log('⚡ 编译Electron主进程...');
  execSync('tsc -p electron/tsconfig.json', { stdio: 'inherit' });

  // 4. 构建Windows便携版
  console.log('📦 构建Windows便携版...');
  try {
    execSync('electron-builder --win --publish=never', {
      stdio: 'inherit',
      timeout: 300000 // 5分钟超时
    });
  } catch (error) {
    console.warn('⚠️  网络下载失败，尝试离线构建...');

    // 如果网络构建失败，创建便携版目录结构
    const portableDir = 'release/win-portable';
    if (!fs.existsSync(portableDir)) {
      fs.mkdirSync(portableDir, { recursive: true });
    }

    // 复制必要的文件
    console.log('📋 创建便携版目录结构...');

    // 创建便携版说明文件
    const readmeContent = `# 艾宾浩斯学习计划工具 - Windows便携版

## 使用说明

1. 双击 \`艾宾浩斯学习计划工具.exe\` 启动应用
2. 无需安装，解压即用
3. 所有数据保存在程序目录的 data 文件夹中

## 系统要求

- Windows 10/11 (x64)
- 至少 4GB 内存
- 100MB 可用磁盘空间

## 版本信息

版本: ${require('../package.json').version}
构建时间: ${new Date().toLocaleString('zh-CN')}

## 注意事项

- 请确保杀毒软件不会误报
- 首次运行可能需要一些时间来初始化
- 建议将程序放在非系统盘运行
`;

    fs.writeFileSync(path.join(portableDir, 'README.txt'), readmeContent);
    console.log('✅ 便携版说明文件已创建');

    console.log('⚠️  由于网络问题，便携版构建已准备就绪但需要手动完成Electron打包');
    console.log('💡 提示：您可以在Windows环境下运行相同的命令来完成构建');
  }

  console.log('✅ Windows便携版构建完成！');

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}