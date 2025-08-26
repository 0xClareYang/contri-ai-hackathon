const { ethers } = require('ethers');
const axios = require('axios');

// 区块链扫描与分析引擎
class BlockchainScannerEngine {
    constructor(config) {
        this.providers = {
            ethereum: new ethers.providers.JsonRpcProvider(config.ethereumRpc),
            polygon: new ethers.providers.JsonRpcProvider(config.polygonRpc),
            bsc: new ethers.providers.JsonRpcProvider(config.bscRpc)
        };
        
        this.alchemyApiKey = config.alchemyApiKey;
        this.etherscanApiKey = config.etherscanApiKey;
        this.analysisCache = new Map();
        this.realTimeMetrics = {
            blocksProcessed: 0,
            transactionsAnalyzed: 0,
            sybilDetected: 0,
            lastUpdate: Date.now()
        };
        
        // 启动实时监控
        this.startRealtimeMonitoring();
    }

    // 1. 地址全面分析
    async analyzeAddress(address, chains = ['ethereum']) {
        const cacheKey = `address:${address}:${chains.join(',')}`;
        
        if (this.analysisCache.has(cacheKey)) {
            const cached = this.analysisCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
                return cached.data;
            }
        }

        try {
            console.log(`🔍 开始分析地址: ${address}`);
            const startTime = Date.now();

            // 并行分析多个链
            const chainAnalyses = await Promise.allSettled(
                chains.map(chain => this.analyzeAddressOnChain(address, chain))
            );

            // 合并各链分析结果
            const combinedAnalysis = this.combineChainAnalyses(address, chainAnalyses, chains);
            
            // 计算综合风险评分
            const riskAssessment = this.calculateRiskAssessment(combinedAnalysis);
            
            // 检测女巫攻击模式
            const sybilAnalysis = await this.detectSybilPatterns(address, combinedAnalysis);

            const analysis = {
                address,
                analyzed_chains: chains,
                address_profile: combinedAnalysis.profile,
                transaction_analysis: combinedAnalysis.transactions,
                behavior_patterns: combinedAnalysis.patterns,
                risk_assessment: riskAssessment,
                sybil_detection: sybilAnalysis,
                analysis_metadata: {
                    analyzed_at: new Date().toISOString(),
                    analysis_duration_ms: Date.now() - startTime,
                    data_sources: this.getDataSources(chains)
                }
            };

            // 缓存结果
            this.analysisCache.set(cacheKey, {
                data: analysis,
                timestamp: Date.now()
            });

            console.log(`✅ 地址分析完成: ${address}, 风险评分: ${riskAssessment.overall_risk_score.toFixed(1)}`);
            return analysis;

        } catch (error) {
            console.error(`❌ 地址分析失败 ${address}:`, error.message);
            throw new Error(`区块链地址分析失败: ${error.message}`);
        }
    }

    // 2. 单链地址分析
    async analyzeAddressOnChain(address, chain) {
        const provider = this.providers[chain];
        if (!provider) {
            throw new Error(`不支持的区块链: ${chain}`);
        }

        const [balance, transactionCount, transactions] = await Promise.all([
            provider.getBalance(address),
            provider.getTransactionCount(address),
            this.getRecentTransactions(address, chain, 100)
        ]);

        return {
            chain,
            balance: ethers.utils.formatEther(balance),
            transaction_count: transactionCount,
            transactions,
            first_activity: transactions.length > 0 ? new Date(transactions[transactions.length - 1].timestamp * 1000) : null,
            last_activity: transactions.length > 0 ? new Date(transactions[0].timestamp * 1000) : null
        };
    }

    // 3. 获取最近交易记录
    async getRecentTransactions(address, chain, limit = 100) {
        try {
            let apiUrl, apiKey;
            
            switch (chain) {
                case 'ethereum':
                    apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.etherscanApiKey}`;
                    break;
                case 'polygon':
                    apiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.etherscanApiKey}`;
                    break;
                case 'bsc':
                    apiUrl = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.etherscanApiKey}`;
                    break;
                default:
                    throw new Error(`Unsupported chain: ${chain}`);
            }

            const response = await axios.get(apiUrl, { timeout: 10000 });
            
            if (response.data.status !== '1') {
                console.warn(`⚠️ API响应异常: ${response.data.message}`);
                return [];
            }

            return response.data.result
                .slice(0, limit)
                .map(tx => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: ethers.utils.formatEther(tx.value),
                    gas_used: parseInt(tx.gasUsed),
                    gas_price: ethers.utils.formatUnits(tx.gasPrice, 'gwei'),
                    timestamp: parseInt(tx.timeStamp),
                    block_number: parseInt(tx.blockNumber),
                    is_error: tx.isError === '1',
                    method_id: tx.methodId || null
                }));

        } catch (error) {
            console.error(`获取${chain}交易记录失败:`, error.message);
            return [];
        }
    }

    // 4. 合并多链分析结果
    combineChainAnalyses(address, chainAnalyses, chains) {
        const successful = chainAnalyses
            .map((result, index) => ({
                chain: chains[index],
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null
            }))
            .filter(result => result.success);

        if (successful.length === 0) {
            throw new Error('所有链的分析都失败了');
        }

        // 计算综合指标
        const totalBalance = successful.reduce((sum, result) => 
            sum + parseFloat(result.data.balance), 0);
        
        const totalTransactions = successful.reduce((sum, result) => 
            sum + result.data.transaction_count, 0);

        const allTransactions = successful.flatMap(result => 
            result.data.transactions.map(tx => ({
                ...tx,
                chain: result.chain
            }))
        );

        // 分析交易模式
        const patterns = this.analyzeTransactionPatterns(allTransactions);

        return {
            profile: {
                total_balance: totalBalance.toFixed(4),
                total_transactions: totalTransactions,
                active_chains: successful.length,
                chains_used: successful.map(r => r.chain),
                first_seen: this.getEarliestActivity(successful),
                last_seen: this.getLatestActivity(successful)
            },
            transactions: allTransactions.slice(0, 50), // 返回最近50笔交易
            patterns
        };
    }

    // 5. 分析交易模式
    analyzeTransactionPatterns(transactions) {
        if (transactions.length === 0) {
            return {
                interaction_frequency: 0,
                gas_usage_pattern: 'unknown',
                time_distribution: {},
                value_distribution: {},
                counterparty_diversity: 0,
                defi_usage: 0,
                behavioral_score: 0
            };
        }

        // 分析交互频率
        const timeSpan = transactions[0].timestamp - transactions[transactions.length - 1].timestamp;
        const interactionFrequency = transactions.length / Math.max(timeSpan / 86400, 1); // 每天交易数

        // 分析Gas使用模式
        const gasUsages = transactions.map(tx => tx.gas_used).filter(Boolean);
        const avgGasUsage = gasUsages.reduce((sum, gas) => sum + gas, 0) / gasUsages.length;
        const gasUsagePattern = this.categorizeGasUsage(avgGasUsage);

        // 分析时间分布
        const timeDistribution = this.analyzeTimeDistribution(transactions);

        // 分析价值分布
        const valueDistribution = this.analyzeValueDistribution(transactions);

        // 分析交互对象多样性
        const uniqueCounterparties = new Set([
            ...transactions.map(tx => tx.from),
            ...transactions.map(tx => tx.to)
        ]).size - 1; // 减去自己

        // DeFi使用检测
        const defiUsage = this.detectDefiUsage(transactions);

        // 行为评分
        const behavioralScore = this.calculateBehavioralScore({
            interactionFrequency,
            gasUsagePattern,
            timeDistribution,
            uniqueCounterparties,
            defiUsage
        });

        return {
            interaction_frequency: interactionFrequency.toFixed(2),
            gas_usage_pattern: gasUsagePattern,
            time_distribution: timeDistribution,
            value_distribution: valueDistribution,
            counterparty_diversity: uniqueCounterparties,
            defi_usage: defiUsage,
            behavioral_score: behavioralScore
        };
    }

    // 6. 计算风险评分
    calculateRiskAssessment(combinedAnalysis) {
        const { profile, patterns } = combinedAnalysis;
        let riskScore = 0;
        const riskFactors = [];

        // 账户年龄风险
        if (profile.first_seen) {
            const accountAgeMs = Date.now() - new Date(profile.first_seen).getTime();
            const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
            
            if (accountAgeDays < 30) {
                riskScore += 30;
                riskFactors.push('new_account');
            } else if (accountAgeDays < 90) {
                riskScore += 15;
                riskFactors.push('relatively_new');
            }
        }

        // 交易频率风险
        const frequency = parseFloat(patterns.interaction_frequency);
        if (frequency > 100) {
            riskScore += 25;
            riskFactors.push('extremely_high_frequency');
        } else if (frequency > 50) {
            riskScore += 15;
            riskFactors.push('high_frequency');
        }

        // 余额风险
        if (parseFloat(profile.total_balance) < 0.01) {
            riskScore += 20;
            riskFactors.push('low_balance');
        }

        // 交互多样性风险
        if (patterns.counterparty_diversity < 5) {
            riskScore += 20;
            riskFactors.push('limited_interactions');
        }

        // 行为模式风险
        if (patterns.behavioral_score < 30) {
            riskScore += 25;
            riskFactors.push('suspicious_behavior');
        }

        return {
            overall_risk_score: Math.min(100, riskScore),
            risk_level: this.categorizeRiskLevel(riskScore),
            risk_factors: riskFactors,
            confidence: this.calculateConfidence(profile, patterns)
        };
    }

    // 7. 女巫攻击检测
    async detectSybilPatterns(address, analysis) {
        const patterns = analysis.patterns;
        const profile = analysis.profile;
        
        let sybilProbability = 0;
        const detectedPatterns = [];
        
        // 时间模式检测
        if (this.isAbnormalTimePattern(patterns.time_distribution)) {
            sybilProbability += 30;
            detectedPatterns.push('abnormal_time_pattern');
        }

        // 交易值模式检测
        if (this.isRoundNumberBias(patterns.value_distribution)) {
            sybilProbability += 20;
            detectedPatterns.push('round_number_bias');
        }

        // Gas价格模式检测
        if (patterns.gas_usage_pattern === 'suspicious') {
            sybilProbability += 25;
            detectedPatterns.push('suspicious_gas_pattern');
        }

        // 交互网络分析
        const networkSimilarity = await this.analyzeNetworkSimilarity(address, analysis.transactions);
        if (networkSimilarity.similarity_score > 0.8) {
            sybilProbability += 35;
            detectedPatterns.push('high_network_similarity');
        }

        return {
            sybil_probability: Math.min(100, sybilProbability),
            detected_patterns: detectedPatterns,
            network_analysis: networkSimilarity,
            confidence: this.calculateSybilConfidence(patterns, profile)
        };
    }

    // 8. 实时监控
    startRealtimeMonitoring() {
        console.log('🔄 启动区块链实时监控...');
        
        // 监控最新区块
        setInterval(async () => {
            try {
                await this.monitorLatestBlocks();
                await this.updateRealTimeMetrics();
            } catch (error) {
                console.error('实时监控错误:', error.message);
            }
        }, 30000); // 每30秒更新

        // 监控内存池
        setInterval(async () => {
            try {
                await this.monitorMempool();
            } catch (error) {
                console.error('内存池监控错误:', error.message);
            }
        }, 15000); // 每15秒更新
    }

    // 9. 监控最新区块
    async monitorLatestBlocks() {
        for (const [chainName, provider] of Object.entries(this.providers)) {
            try {
                const latestBlock = await provider.getBlock('latest');
                
                if (latestBlock && latestBlock.transactions) {
                    this.realTimeMetrics.blocksProcessed++;
                    this.realTimeMetrics.transactionsAnalyzed += latestBlock.transactions.length;
                    
                    // 简单的可疑交易检测
                    const suspiciousCount = await this.detectSuspiciousTransactions(latestBlock.transactions, chainName);
                    this.realTimeMetrics.sybilDetected += suspiciousCount;
                }
                
            } catch (error) {
                console.warn(`${chainName} 区块监控失败:`, error.message);
            }
        }
    }

    // 10. 可疑交易检测
    async detectSuspiciousTransactions(txHashes, chain) {
        let suspiciousCount = 0;
        
        // 简化版检测逻辑
        for (const txHash of txHashes.slice(0, 10)) { // 只检测前10个交易
            try {
                const tx = await this.providers[chain].getTransaction(txHash);
                
                if (tx && this.isSuspiciousTransaction(tx)) {
                    suspiciousCount++;
                }
                
            } catch (error) {
                continue;
            }
        }
        
        return suspiciousCount;
    }

    // 11. 更新实时指标
    async updateRealTimeMetrics() {
        this.realTimeMetrics.lastUpdate = Date.now();
        
        // 这里可以添加更多实时指标计算
        // 例如：网络健康度、处理速度等
    }

    // 12. 获取实时指标
    getRealTimeMetrics() {
        const now = Date.now();
        const uptimeHours = (now - (now - 3600000)) / 3600000; // 简化的运行时间
        
        return {
            blocks_processed_per_hour: Math.floor(this.realTimeMetrics.blocksProcessed / Math.max(uptimeHours, 1)),
            transactions_analyzed: this.realTimeMetrics.transactionsAnalyzed,
            sybil_detected: this.realTimeMetrics.sybilDetected,
            network_health: this.calculateNetworkHealth(),
            active_chains: Object.keys(this.providers).length,
            cache_size: this.analysisCache.size,
            last_update: new Date(this.realTimeMetrics.lastUpdate).toISOString()
        };
    }

    // 辅助方法
    categorizeGasUsage(avgGas) {
        if (avgGas < 21000) return 'simple_transfer';
        if (avgGas < 100000) return 'basic_contract';
        if (avgGas < 300000) return 'complex_contract';
        if (avgGas > 500000) return 'suspicious';
        return 'normal';
    }

    categorizeRiskLevel(score) {
        if (score < 30) return 'LOW';
        if (score < 60) return 'MEDIUM';
        if (score < 80) return 'HIGH';
        return 'CRITICAL';
    }

    calculateNetworkHealth() {
        // 简化的网络健康度计算
        const providerCount = Object.keys(this.providers).length;
        const cacheHitRate = Math.min(1, this.analysisCache.size / 100);
        return Math.min(100, 70 + (providerCount * 10) + (cacheHitRate * 20));
    }

    calculateConfidence(profile, patterns) {
        let confidence = 50;
        
        if (profile.total_transactions > 100) confidence += 20;
        if (profile.active_chains > 1) confidence += 15;
        if (patterns.counterparty_diversity > 10) confidence += 15;
        
        return Math.min(100, confidence);
    }

    // 其他辅助方法
    analyzeTimeDistribution(transactions) {
        const hours = {};
        transactions.forEach(tx => {
            const hour = new Date(tx.timestamp * 1000).getHours();
            hours[hour] = (hours[hour] || 0) + 1;
        });
        return hours;
    }

    analyzeValueDistribution(transactions) {
        const values = transactions.map(tx => parseFloat(tx.value)).filter(v => v > 0);
        if (values.length === 0) return {};
        
        return {
            min: Math.min(...values).toFixed(6),
            max: Math.max(...values).toFixed(6),
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(6),
            total: values.reduce((a, b) => a + b, 0).toFixed(6)
        };
    }

    detectDefiUsage(transactions) {
        // 简化的DeFi检测逻辑
        const defiIndicators = transactions.filter(tx => 
            tx.gas_used > 100000 || // 复杂合约交互
            tx.method_id // 有方法调用
        ).length;
        
        return Math.min(100, (defiIndicators / transactions.length) * 100);
    }

    calculateBehavioralScore(metrics) {
        let score = 50;
        
        if (metrics.interactionFrequency > 0 && metrics.interactionFrequency < 10) score += 20;
        if (metrics.uniqueCounterparties > 5) score += 15;
        if (metrics.defiUsage > 0) score += 15;
        
        return Math.min(100, score);
    }

    // 需要实现的复杂方法(简化版)
    isAbnormalTimePattern(timeDistribution) {
        const hours = Object.keys(timeDistribution).map(Number);
        const variance = this.calculateVariance(hours);
        return variance < 10; // 如果时间分布过于集中
    }

    isRoundNumberBias(valueDistribution) {
        return false; // 简化实现
    }

    async analyzeNetworkSimilarity(address, transactions) {
        return {
            similarity_score: Math.random() * 0.5, // 简化实现
            similar_addresses: [],
            cluster_id: null
        };
    }

    calculateSybilConfidence(patterns, profile) {
        return 75; // 简化实现
    }

    isSuspiciousTransaction(tx) {
        return tx.gasPrice && parseInt(tx.gasPrice) === 0; // 零Gas价格可疑
    }

    getEarliestActivity(successful) {
        const dates = successful
            .map(r => r.data.first_activity)
            .filter(Boolean)
            .map(d => new Date(d).getTime());
        return dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null;
    }

    getLatestActivity(successful) {
        const dates = successful
            .map(r => r.data.last_activity)
            .filter(Boolean)
            .map(d => new Date(d).getTime());
        return dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;
    }

    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        const mean = numbers.reduce((a, b) => a + b) / numbers.length;
        return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    }

    getDataSources(chains) {
        return chains.map(chain => ({
            chain,
            provider: 'JSON-RPC',
            api: chain === 'ethereum' ? 'Etherscan' : `${chain}scan`
        }));
    }

    async monitorMempool() {
        // 内存池监控的简化实现
        console.log('💫 监控内存池...');
    }
}

module.exports = { BlockchainScannerEngine };