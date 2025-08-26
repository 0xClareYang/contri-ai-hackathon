#!/bin/bash

# Contri AI 后端服务启动脚本
echo "🚀 启动 Contri AI 后端服务..."

# 检查Node.js版本
NODE_VERSION=$(node --version)
echo "📦 Node.js 版本: $NODE_VERSION"

# 检查环境变量
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，复制示例文件..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件配置必要的API密钥"
    echo "   - GITHUB_TOKEN: GitHub个人访问令牌"
    echo "   - ETHEREUM_RPC_URL: 以太坊RPC端点"
    echo "   - ETHERSCAN_API_KEY: Etherscan API密钥"
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📚 安装依赖包..."
    npm install
fi

# 检查关键环境变量
source .env
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 错误: GITHUB_TOKEN 未设置"
    echo "请在 .env 文件中设置 GITHUB_TOKEN=your_token_here"
    exit 1
fi

echo "✅ 环境检查完成"

# 启动服务
echo "🔥 启动主API服务..."
if [ "$1" = "dev" ]; then
    echo "🛠️  开发模式 (使用 nodemon)"
    npm run dev
elif [ "$1" = "test" ]; then
    echo "🧪 运行测试"
    node test-github-engine.js
else
    echo "🚀 生产模式"
    npm start
fi