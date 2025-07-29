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

// 复制 public 目录到 dist
if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { recursive: true })
  console.log('复制 public 目录到 dist')
}

/**
 * @type {esbuild.BuildOptions}
 */
const esbuildOpts = {
  color: true,
  entryPoints: ['src/main.tsx', 'index.html'],
  outdir: 'dist',
  entryNames: '[name]',
  write: true,
  bundle: true,
  format: 'iife',
  sourcemap: isProd ? false : 'linked',
  minify: isProd,
  treeShaking: true,
  jsx: 'automatic',
  loader: {
    '.html': 'copy',
    '.png': 'file',
  },
  plugins: [
    stylePlugin({
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    }),
  ],
}

if (isProd) {
  await esbuild.build(esbuildOpts)
  
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
} else {
  const ctx = await esbuild.context(esbuildOpts)
  await ctx.watch()
  const { hosts, port } = await ctx.serve()
  console.log(`Running on:`)
  hosts.forEach((host) => {
    console.log(`http://${host}:${port}`)
  })
}
