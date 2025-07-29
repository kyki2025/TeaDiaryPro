import * as esbuild from 'esbuild'
import { rimraf } from 'rimraf'
import stylePlugin from 'esbuild-style-plugin'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const isProd = args[0] === '--production'

// 保存配置文件
const configFiles = ['_headers', '_redirects']
const savedConfigs = {}

// 在清空 dist 目录前保存配置文件
if (fs.existsSync('dist')) {
  configFiles.forEach(file => {
    const filePath = path.join('dist', file)
    if (fs.existsSync(filePath)) {
      savedConfigs[file] = fs.readFileSync(filePath, 'utf8')
    }
  })
}

await rimraf('dist')

// 创建 dist 目录
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

// 复制 public 目录到 dist，但排除 index.html
if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { 
    recursive: true,
    filter: (src, dest) => {
      // 排除 index.html，我们会在构建后生成
      return !src.endsWith('index.html')
    }
  })
  console.log('复制 public 目录到 dist (排除 index.html)')
}

// 创建基础的 index.html 模板
const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>茶记 - 品茶记录应用</title>
    <meta name="description" content="记录您的品茶体验，管理茶叶收藏">
    <meta name="theme-color" content="#10b981">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="https://pub-cdn.sider.ai/u/U01AHE70X2G/web-coder/6884695094baea4807e5eee6/resource/ecf96b3c-aa5d-49bc-969f-95d4949947a0.jpg" type="image/png">
    
    <!-- PWA相关 -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="茶记">
    <link rel="apple-touch-icon" href="https://pub-cdn.sider.ai/u/U01AHE70X2G/web-coder/6884695094baea4807e5eee6/resource/ecf96b3c-aa5d-49bc-969f-95d4949947a0.jpg">
    
    <!-- 移动端优化 -->
    <meta name="format-detection" content="telephone=no">
    <meta name="mobile-web-app-capable" content="yes">
</head>
<body>
    <div id="app"></div>
    
    <!-- PWA服务工作者注册 -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    </script>
</body>
</html>`

fs.writeFileSync(path.join('dist', 'index.html'), htmlTemplate)
console.log('创建 HTML 模板')

/**
 * @type {esbuild.BuildOptions}
 */
const webAppOpts = {
  color: true,
  entryPoints: ['src/main.tsx'],
  outdir: 'dist',
  entryNames: '[name].[hash]',
  assetNames: '[name].[hash]',
  write: true,
  bundle: true,
  format: 'iife',
  sourcemap: isProd ? false : 'linked',
  minify: isProd,
  treeShaking: true,
  jsx: 'automatic',
  metafile: true,
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
  },
  plugins: [
    stylePlugin({
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    }),
  ],
}

/**
 * @type {esbuild.BuildOptions}
 */
const workerOpts = {
  color: true,
  entryPoints: ['src/worker.js'],
  outfile: 'dist/worker.js',
  write: true,
  bundle: true,
  format: 'esm',
  target: 'es2022',
  sourcemap: isProd ? false : 'linked',
  minify: isProd,
  treeShaking: true,
  external: ['__STATIC_CONTENT_MANIFEST'],
  define: {
    '__STATIC_CONTENT_MANIFEST': '__STATIC_CONTENT_MANIFEST',
  },
}

if (isProd) {
  // 构建 Web 应用
  console.log('构建 Web 应用...')
  const result = await esbuild.build(webAppOpts)
  
  // 更新HTML文件以引用生成的资源
  const htmlPath = path.join('dist', 'index.html')
  let htmlContent = fs.readFileSync(htmlPath, 'utf8')
  
  // 从metafile中获取生成的文件名
  const outputs = result.metafile.outputs
  let jsFile = '', cssFile = ''
  
  for (const [outputPath, output] of Object.entries(outputs)) {
    const fileName = path.basename(outputPath)
    if (fileName.startsWith('main.') && fileName.endsWith('.js')) {
      jsFile = fileName
    } else if (fileName.startsWith('main.') && fileName.endsWith('.css')) {
      cssFile = fileName
    }
  }
  
  // 更新HTML内容
  if (cssFile) {
    htmlContent = htmlContent.replace(
      '</head>',
      `  <link rel="stylesheet" href="/${cssFile}">\n</head>`
    )
  }
  
  if (jsFile) {
    htmlContent = htmlContent.replace(
      '</body>',
      `  <script src="/${jsFile}"></script>\n</body>`
    )
  }
  
  fs.writeFileSync(htmlPath, htmlContent)
  console.log(`HTML文件已更新，引用: ${jsFile}, ${cssFile}`)
  
  // 构建 Worker
  console.log('构建 Worker...')
  await esbuild.build(workerOpts)
  
  // 恢复配置文件
  Object.keys(savedConfigs).forEach(file => {
    const filePath = path.join('dist', file)
    fs.writeFileSync(filePath, savedConfigs[file])
    console.log(`恢复配置文件: ${file}`)
  })
  
  // 如果没有保存的配置文件，创建默认的
  if (!savedConfigs['_headers']) {
    const headersContent = `# 设置正确的 MIME 类型和安全头
/*.css
  Content-Type: text/css
  Cache-Control: public, max-age=31536000

/*.js
  Content-Type: application/javascript
  Cache-Control: public, max-age=31536000

/*.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate

# 全局安全头
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

# 特定文件类型的 MIME 设置
/main.css
  Content-Type: text/css; charset=utf-8

/main.js
  Content-Type: application/javascript; charset=utf-8

/index.html
  Content-Type: text/html; charset=utf-8`
    fs.writeFileSync(path.join('dist', '_headers'), headersContent)
    console.log('创建默认 _headers 文件')
  }
  
  if (!savedConfigs['_redirects']) {
    const redirectsContent = `# 单页应用路由重定向
/*    /index.html   200`
    fs.writeFileSync(path.join('dist', '_redirects'), redirectsContent)
    console.log('创建默认 _redirects 文件')
  }
  
  console.log('构建完成！')
} else {
  const ctx = await esbuild.context(webAppOpts)
  await ctx.watch()
  const { hosts, port } = await ctx.serve()
  console.log(`Running on:`)
  hosts.forEach((host) => {
    console.log(`http://${host}:${port}`)
  })
}
