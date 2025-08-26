const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// 导入分析引擎
const { GitHubAnalysisEngine } = require('./github-analysis-service');
const { BlockchainScannerEngine } = require('./blockchain-scanner-service');

// Contri AI 主API服务
class ContriAIService {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.initializeEngines();
        this.setupRoutes();
        this.setupErrorHandling();
        
        // 实时数据存储
        this.realtimeData = {
            activeContributors: 12847,
            aiProcessingScore: 94.7,
            systemHealth: 98.5,
            githubEventsPerMinute: 127,
            blockchainEventsPerMinute: 89,
            sybilDetected: 342,
            authenticityRate: 96.2,
            networkLatency: 45,
            lastUpdate: Date.now()
        };

        this.startRealtimeUpdates();
    }

    // 1. 中间件设置
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(morgan('combined'));
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // 速率限制
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15分钟
            max: process.env.RATE_LIMIT || 100,
            message: {
                error: 'Too many requests',
                message: '请求过于频繁，请稍后再试'
            }
        });
        this.app.use('/api/', limiter);
    }

    // 2. 初始化分析引擎
    initializeEngines() {
        console.log('🔧 初始化分析引擎...');
        
        // GitHub分析引擎
        if (process.env.GITHUB_TOKEN) {
            this.githubEngine = new GitHubAnalysisEngine(process.env.GITHUB_TOKEN);
            console.log('✅ GitHub分析引擎已初始化');
        } else {
            console.warn('⚠️  GITHUB_TOKEN未设置，GitHub分析功能将不可用');
        }

        // 区块链扫描引擎
        const blockchainConfig = {
            ethereumRpc: process.env.ETHEREUM_RPC_URL,
            polygonRpc: process.env.POLYGON_RPC_URL,
            bscRpc: process.env.BSC_RPC_URL,
            alchemyApiKey: process.env.ALCHEMY_API_KEY,
            etherscanApiKey: process.env.ETHERSCAN_API_KEY
        };

        if (blockchainConfig.ethereumRpc) {
            this.blockchainEngine = new BlockchainScannerEngine(blockchainConfig);
            console.log('✅ 区块链扫描引擎已初始化');
        } else {
            console.warn('⚠️  区块链RPC未设置，区块链分析功能将不可用');
        }
    }

    // 3. 路由设置
    setupRoutes() {
        // 健康检查
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    github: !!this.githubEngine,
                    blockchain: !!this.blockchainEngine
                },
                uptime: process.uptime()
            });
        });

        // 实时指标API
        this.app.get('/api/realtime/metrics', (req, res) => {
            try {
                const metrics = this.getRealTimeMetrics();
                res.json({
                    success: true,
                    data: metrics
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // GitHub分析API
        this.setupGitHubRoutes();
        
        // 区块链分析API
        this.setupBlockchainRoutes();
        
        // 综合分析API
        this.setupCombinedAnalysisRoutes();
        
        // WebSocket支持
        this.setupWebSocketRoutes();
    }

    // 4. GitHub路由
    setupGitHubRoutes() {
        // 单用户分析
        this.app.get('/api/github/analyze/:username', async (req, res) => {
            try {
                if (!this.githubEngine) {
                    return res.status(503).json({
                        success: false,
                        error: 'GitHub分析服务未配置'
                    });
                }

                const { username } = req.params;
                const analysis = await this.githubEngine.analyzeUser(username);
                
                // 更新实时指标
                this.realtimeData.githubEventsPerMinute += Math.floor(Math.random() * 20);
                this.realtimeData.lastUpdate = Date.now();
                
                res.json({
                    success: true,
                    data: analysis
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 批量分析
        this.app.post('/api/github/analyze-batch', async (req, res) => {
            try {
                if (!this.githubEngine) {
                    return res.status(503).json({
                        success: false,
                        error: 'GitHub分析服务未配置'
                    });
                }

                const { usernames } = req.body;
                
                if (!Array.isArray(usernames) || usernames.length > 10) {
                    return res.status(400).json({
                        success: false,
                        error: '用户名列表无效或超过限制(最多10个)'
                    });
                }

                const results = await Promise.allSettled(
                    usernames.map(username => this.githubEngine.analyzeUser(username))
                );

                const analyses = results.map((result, index) => ({
                    username: usernames[index],
                    success: result.status === 'fulfilled',
                    data: result.status === 'fulfilled' ? result.value : null,
                    error: result.status === 'rejected' ? result.reason.message : null
                }));

                res.json({
                    success: true,
                    data: analyses
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // GitHub统计
        this.app.get('/api/github/stats', (req, res) => {
            if (!this.githubEngine) {
                return res.status(503).json({
                    success: false,
                    error: 'GitHub分析服务未配置'
                });
            }

            res.json({
                success: true,
                data: this.githubEngine.getAnalysisStats()
            });
        });
    }

    // 5. 区块链路由
    setupBlockchainRoutes() {
        // 地址分析
        this.app.get('/api/blockchain/analyze/:address', async (req, res) => {
            try {
                if (!this.blockchainEngine) {
                    return res.status(503).json({
                        success: false,
                        error: '区块链分析服务未配置'
                    });
                }

                const { address } = req.params;
                const { chains } = req.query;
                
                const chainList = chains ? chains.split(',') : ['ethereum'];
                const analysis = await this.blockchainEngine.analyzeAddress(address, chainList);
                
                // 更新实时指标
                this.realtimeData.blockchainEventsPerMinute += Math.floor(Math.random() * 15);
                if (analysis.risk_assessment.risk_level === 'HIGH') {
                    this.realtimeData.sybilDetected += 1;
                }
                this.realtimeData.lastUpdate = Date.now();
                
                res.json({
                    success: true,
                    data: analysis
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 实时区块链指标
        this.app.get('/api/blockchain/realtime', (req, res) => {
            if (!this.blockchainEngine) {
                return res.status(503).json({
                    success: false,
                    error: '区块链分析服务未配置'
                });
            }

            res.json({
                success: true,
                data: this.blockchainEngine.getRealTimeMetrics()
            });
        });
    }

    // 6. 综合分析路由
    setupCombinedAnalysisRoutes() {
        // 全面用户分析
        this.app.post('/api/analyze/comprehensive', async (req, res) => {
            try {
                const { github_username, wallet_address, chains } = req.body;
                
                const results = {};
                
                // 并行分析GitHub和区块链数据
                const promises = [];
                
                if (github_username && this.githubEngine) {
                    promises.push(
                        this.githubEngine.analyzeUser(github_username)
                            .then(data => ({ github: data }))
                            .catch(error => ({ github_error: error.message }))
                    );
                }
                
                if (wallet_address && this.blockchainEngine) {
                    promises.push(
                        this.blockchainEngine.analyzeAddress(wallet_address, chains || ['ethereum'])
                            .then(data => ({ blockchain: data }))
                            .catch(error => ({ blockchain_error: error.message }))
                    );
                }

                const analysisResults = await Promise.all(promises);
                
                // 合并结果
                analysisResults.forEach(result => {
                    Object.assign(results, result);
                });

                // 计算综合评分
                if (results.github && results.blockchain) {
                    results.combined_score = this.calculateCombinedScore(results.github, results.blockchain);
                }

                res.json({
                    success: true,
                    data: {
                        ...results,
                        analyzed_at: new Date().toISOString()
                    }
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 女巫检测专用API
        this.app.post('/api/analyze/sybil-detection', async (req, res) => {
            try {
                const { accounts } = req.body;
                
                if (!Array.isArray(accounts) || accounts.length > 50) {
                    return res.status(400).json({
                        success: false,
                        error: '账户列表无效或超过限制(最多50个)'
                    });
                }

                const sybilResults = [];
                
                for (const account of accounts) {
                    try {
                        const result = await this.detectSybilAccount(account);
                        sybilResults.push({
                            account,
                            sybil_probability: result.probability,
                            risk_factors: result.factors,
                            confidence: result.confidence
                        });
                    } catch (error) {
                        sybilResults.push({
                            account,
                            error: error.message
                        });
                    }
                }

                res.json({
                    success: true,
                    data: {
                        total_analyzed: accounts.length,
                        sybil_detected: sybilResults.filter(r => r.sybil_probability > 70).length,
                        results: sybilResults
                    }
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    // 7. WebSocket路由(简化版)
    setupWebSocketRoutes() {
        this.app.get('/api/ws/info', (req, res) => {
            res.json({
                success: true,
                message: 'WebSocket将在后续版本中实现',
                endpoints: {
                    realtime_metrics: '/ws/metrics',
                    analysis_updates: '/ws/analysis'
                }
            });
        });
    }

    // 8. 获取实时指标
    getRealTimeMetrics() {
        // 添加一些随机变化来模拟实时数据
        const variance = {
            activeContributors: Math.floor(Math.random() * 20 - 10),
            aiProcessingScore: (Math.random() - 0.5) * 1.5,
            systemHealth: (Math.random() - 0.5) * 0.3,
            githubEventsPerMinute: Math.floor(Math.random() * 30 - 15),
            blockchainEventsPerMinute: Math.floor(Math.random() * 20 - 10),
            sybilDetected: Math.floor(Math.random() * 5 - 2),
            authenticityRate: (Math.random() - 0.5) * 0.5,
            networkLatency: Math.floor(Math.random() * 20 - 10)
        };

        // 更新数值但保持在合理范围内
        this.realtimeData.activeContributors = Math.max(1000, 
            this.realtimeData.activeContributors + variance.activeContributors);
        this.realtimeData.aiProcessingScore = Math.max(85, Math.min(99.9, 
            this.realtimeData.aiProcessingScore + variance.aiProcessingScore));
        this.realtimeData.systemHealth = Math.max(90, Math.min(100, 
            this.realtimeData.systemHealth + variance.systemHealth));
        this.realtimeData.githubEventsPerMinute = Math.max(50, 
            this.realtimeData.githubEventsPerMinute + variance.githubEventsPerMinute);
        this.realtimeData.blockchainEventsPerMinute = Math.max(30, 
            this.realtimeData.blockchainEventsPerMinute + variance.blockchainEventsPerMinute);
        this.realtimeData.sybilDetected = Math.max(100, 
            this.realtimeData.sybilDetected + variance.sybilDetected);
        this.realtimeData.authenticityRate = Math.max(90, Math.min(99.9, 
            this.realtimeData.authenticityRate + variance.authenticityRate));
        this.realtimeData.networkLatency = Math.max(10, Math.min(200, 
            this.realtimeData.networkLatency + variance.networkLatency));

        return {
            ...this.realtimeData,
            processedTransactions: Math.floor(89234 + Math.random() * 1000),
            activeNodes: Math.floor(1247 + Math.random() * 100),
            threatLevel: this.realtimeData.sybilDetected > 400 ? 'HIGH' : 
                        this.realtimeData.sybilDetected > 300 ? 'MEDIUM' : 'LOW',
            energyEfficiency: Math.max(85, Math.min(99, 92.8 + (Math.random() - 0.5) * 2))
        };
    }

    // 9. 计算综合评分
    calculateCombinedScore(githubData, blockchainData) {
        const githubScore = githubData.contribution_analysis.authenticity_score;
        const blockchainScore = 100 - blockchainData.risk_assessment.overall_risk_score;
        
        return {
            overall_authenticity: ((githubScore * 0.6) + (blockchainScore * 0.4)).toFixed(1),
            github_weight: 60,
            blockchain_weight: 40,
            confidence: Math.min(
                githubData.risk_assessment.confidence_level,
                blockchainData.risk_assessment.confidence
            )
        };
    }

    // 10. 女巫账户检测
    async detectSybilAccount(account) {
        let totalProbability = 0;
        const factors = [];
        let confidence = 50;

        // GitHub检测
        if (account.github_username && this.githubEngine) {
            try {
                const githubAnalysis = await this.githubEngine.analyzeUser(account.github_username);
                totalProbability += githubAnalysis.risk_assessment.sybil_probability * 0.6;
                factors.push(...githubAnalysis.risk_assessment.risk_factors);
                confidence = Math.max(confidence, githubAnalysis.risk_assessment.confidence_level);
            } catch (error) {
                factors.push('github_analysis_failed');
            }
        }

        // 区块链检测
        if (account.wallet_address && this.blockchainEngine) {
            try {
                const blockchainAnalysis = await this.blockchainEngine.analyzeAddress(account.wallet_address);
                totalProbability += blockchainAnalysis.sybil_detection.sybil_probability * 0.4;
                factors.push(...blockchainAnalysis.sybil_detection.detected_patterns);
                confidence = Math.max(confidence, blockchainAnalysis.sybil_detection.confidence);
            } catch (error) {
                factors.push('blockchain_analysis_failed');
            }
        }

        return {
            probability: Math.min(100, totalProbability),
            factors: [...new Set(factors)], // 去重
            confidence: Math.min(100, confidence)
        };
    }

    // 11. 启动实时更新
    startRealtimeUpdates() {
        setInterval(() => {
            this.realtimeData.lastUpdate = Date.now();
            // 这里可以添加更多实时数据更新逻辑
        }, 3000); // 每3秒更新一次
    }

    // 12. 错误处理
    setupErrorHandling() {
        // 404处理
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'API端点不存在',
                available_endpoints: {
                    github: '/api/github/*',
                    blockchain: '/api/blockchain/*',
                    realtime: '/api/realtime/*',
                    comprehensive: '/api/analyze/*'
                }
            });
        });

        // 全局错误处理
        this.app.use((error, req, res, next) => {
            console.error('API错误:', error);
            res.status(500).json({
                success: false,
                error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
            });
        });
    }

    // 13. 启动服务
    start(port = process.env.PORT || 3001) {
        this.app.listen(port, () => {
            console.log(`🚀 Contri AI API服务启动成功`);
            console.log(`📡 端口: ${port}`);
            console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 API文档: http://localhost:${port}/health`);
            console.log(`📈 实时指标: http://localhost:${port}/api/realtime/metrics`);
        });
    }
}

// 启动服务
if (require.main === module) {
    const service = new ContriAIService();
    service.start();
}

module.exports = ContriAIService;