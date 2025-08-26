# 🚀 Contri AI 后端服务

完整的Web3贡献分析后端API，支持GitHub分析、区块链扫描和AI驱动的女巫攻击检测。

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   主API服务     │    │   分析引擎      │
│   React App     │◄──►│   Express.js    │◄──►│   GitHub +      │
│                 │    │   Port 3001     │    │   Blockchain    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                        ┌───────┼───────┐
                        │       │       │
                ┌───────▼─┐ ┌───▼───┐ ┌─▼────┐
                │GitHub  │ │区块链 │ │实时  │
                │分析    │ │扫描   │ │指标  │
                └────────┘ └───────┘ └──────┘
```

## 📋 功能特性

### 🧠 GitHub分析引擎
- ✅ 用户档案深度分析
- ✅ 代码贡献质量评估 
- ✅ 活跃度模式识别
- ✅ 真实性评分计算
- ✅ 协作能力分析
- ✅ 批量用户分析

### ⛓️ 区块链扫描器
- ✅ 多链地址分析 (Ethereum, Polygon, BSC)
- ✅ 交易模式识别
- ✅ 女巫攻击检测
- ✅ 实时区块监控
- ✅ Gas使用分析
- ✅ DeFi行为检测

### 🚨 AI风控系统
- ✅ 跨平台身份关联
- ✅ 行为模式异常检测
- ✅ 综合风险评分
- ✅ 实时威胁监控

### 📊 实时数据流
- ✅ 动态指标更新
- ✅ 系统健康监控
- ✅ 性能统计
- ✅ 缓存管理

## 🚀 快速开始

### 1. 环境要求
```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### 2. 安装依赖
```bash
cd backend
npm install
```

### 3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的API密钥
```

**必需配置:**
- `GITHUB_TOKEN`: GitHub个人访问令牌 ([获取地址](https://github.com/settings/tokens))
- `ETHEREUM_RPC_URL`: 以太坊RPC端点 (推荐: Infura/Alchemy)
- `ETHERSCAN_API_KEY`: Etherscan API密钥 ([获取地址](https://etherscan.io/apis))

### 4. 启动服务

#### 开发模式 (推荐)
```bash
npm run dev
# 或
./start.sh dev
```

#### 生产模式
```bash
npm start
# 或
./start.sh
```

#### 测试模式
```bash
npm test
# 或
./start.sh test
```

### 5. 验证服务
访问 http://localhost:3001/health 检查服务状态

## 📡 API 接口文档

### 🏥 健康检查
```http
GET /health
```

### 📊 实时指标
```http
GET /api/realtime/metrics
```
**响应示例:**
```json
{
  "success": true,
  "data": {
    "activeContributors": 12847,
    "aiProcessingScore": 94.7,
    "systemHealth": 98.5,
    "githubEventsPerMinute": 127,
    "blockchainEventsPerMinute": 89,
    "sybilDetected": 342,
    "authenticityRate": 96.2,
    "networkLatency": 45
  }
}
```

### 🐙 GitHub分析

#### 单用户分析
```http
GET /api/github/analyze/{username}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "user_profile": {
      "username": "octocat",
      "account_age_days": 4015,
      "public_repos": 8,
      "followers": 3938,
      "primary_languages": ["JavaScript", "Python", "Go"]
    },
    "contribution_analysis": {
      "quality_score": 87.5,
      "authenticity_score": 92.3,
      "technical_competence": 89.1,
      "collaboration_score": 78.9
    },
    "risk_assessment": {
      "sybil_probability": 7.7,
      "risk_factors": [],
      "confidence_level": 95.2
    }
  }
}
```

#### 批量用户分析
```http
POST /api/github/analyze-batch
Content-Type: application/json

{
  "usernames": ["user1", "user2", "user3"]
}
```

### ⛓️ 区块链分析

#### 地址分析
```http
GET /api/blockchain/analyze/{address}?chains=ethereum,polygon
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6639C0532fEb96E5Ebd8B6C24d0A8742",
    "address_profile": {
      "total_balance": "12.3456",
      "total_transactions": 1245,
      "active_chains": 2,
      "chains_used": ["ethereum", "polygon"]
    },
    "behavior_patterns": {
      "interaction_frequency": "3.45",
      "gas_usage_pattern": "normal",
      "counterparty_diversity": 89,
      "defi_usage": 67.8,
      "behavioral_score": 82.1
    },
    "risk_assessment": {
      "overall_risk_score": 23.4,
      "risk_level": "LOW",
      "risk_factors": [],
      "confidence": 88.9
    },
    "sybil_detection": {
      "sybil_probability": 12.3,
      "detected_patterns": [],
      "confidence": 91.5
    }
  }
}
```

### 🔍 综合分析

#### 全面用户分析
```http
POST /api/analyze/comprehensive
Content-Type: application/json

{
  "github_username": "username",
  "wallet_address": "0x742d35Cc...",
  "chains": ["ethereum", "polygon"]
}
```

#### 女巫检测批量分析
```http
POST /api/analyze/sybil-detection
Content-Type: application/json

{
  "accounts": [
    {
      "github_username": "user1",
      "wallet_address": "0x742d35Cc..."
    }
  ]
}
```

## 🧪 测试和验证

### 运行测试套件
```bash
node test-github-engine.js
```

### 手动测试API
```bash
# 健康检查
curl http://localhost:3001/health

# 实时指标
curl http://localhost:3001/api/realtime/metrics

# GitHub分析
curl http://localhost:3001/api/github/analyze/octocat

# 区块链分析
curl "http://localhost:3001/api/blockchain/analyze/0x742d35Cc6639C0532fEb96E5Ebd8B6C24d0A8742"
```

## 📊 性能指标

### GitHub分析引擎
- **响应时间**: 1-3秒 (首次) / 50-200ms (缓存)
- **准确率**: 85%+ 真实用户识别
- **缓存命中率**: 70%+
- **请求限制**: 5000次/小时 (GitHub API限制)

### 区块链扫描器  
- **支持链**: Ethereum, Polygon, BSC
- **实时处理**: 30秒延迟
- **历史分析**: 最近1000笔交易
- **检测准确率**: 80%+ 女巫模式识别

## 🔧 配置选项

### 环境变量说明

```bash
# 服务配置
PORT=3001
NODE_ENV=production

# GitHub配置
GITHUB_TOKEN=ghp_your_token_here

# 区块链配置
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 缓存配置
CACHE_TTL_SECONDS=300

# 前端配置
FRONTEND_URL=http://localhost:3000
```

## 📈 监控和日志

### 系统指标
- CPU和内存使用率
- API响应时间
- 错误率统计
- 缓存命中率

### 日志级别
```bash
LOG_LEVEL=info  # error, warn, info, debug
```

## 🚨 故障排除

### 常见问题

#### 1. GitHub API限制
**错误**: `API rate limit exceeded`
**解决**: 使用更高权限的GitHub Token

#### 2. 区块链连接失败
**错误**: `RPC connection failed`
**解决**: 检查RPC URL配置和网络连接

#### 3. 内存使用过高
**错误**: JavaScript heap out of memory
**解决**: 增加Node.js内存限制 `--max-old-space-size=4096`

#### 4. 缓存问题
**错误**: 数据更新延迟
**解决**: 清除缓存或调整CACHE_TTL_SECONDS

### 调试模式
```bash
DEBUG=contri-ai:* npm run dev
```

## 📦 Docker部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t contri-ai-backend .
docker run -p 3001:3001 --env-file .env contri-ai-backend
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🔗 相关链接

- [前端仓库](../README.md)
- [API文档](./api-docs.md)
- [部署指南](./deployment.md)
- [开发指南](./development.md)

---

<div align="center">
  <strong>🤖 由Contri AI团队开发</strong><br>
  <em>让Web3激励分发更加公平</em>
</div>