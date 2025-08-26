const { GitHubAnalysisEngine } = require('./github-analysis-service');

// GitHub分析引擎测试脚本
class GitHubAnalysisTest {
    constructor() {
        // 使用你的GitHub Token (可以是public readonly token)
        this.engine = new GitHubAnalysisEngine(process.env.GITHUB_TOKEN || 'ghp_your_token_here');
    }

    async runTests() {
        console.log('🧪 开始GitHub分析引擎测试...\n');

        // 测试用例 - 分析知名开发者
        const testUsers = [
            'octocat',        // GitHub官方测试账号
            'torvalds',       // Linus Torvalds
            '0xClareYang',    // 你的账号
            'defunkt',        // GitHub联合创始人
            'gaearon'         // React核心开发者
        ];

        for (const username of testUsers) {
            try {
                console.log(`🔍 分析用户: ${username}`);
                const startTime = Date.now();
                
                const analysis = await this.engine.analyzeUser(username);
                
                const duration = Date.now() - startTime;
                console.log(`✅ 分析完成 (${duration}ms)`);
                
                // 打印关键指标
                this.printAnalysisResults(username, analysis);
                console.log('─'.repeat(60));
                
            } catch (error) {
                console.error(`❌ 分析失败 ${username}: ${error.message}`);
            }
        }

        // 打印引擎统计信息
        console.log('\n📊 引擎统计信息:');
        console.table(this.engine.getAnalysisStats());
    }

    printAnalysisResults(username, analysis) {
        const { user_profile, contribution_analysis, risk_assessment } = analysis;
        
        console.log(`
👤 用户档案:
   - 账户年龄: ${user_profile.account_age_days} 天
   - 公开仓库: ${user_profile.public_repos}
   - 关注者: ${user_profile.followers}
   - 主要语言: ${user_profile.primary_languages.slice(0, 3).join(', ')}

📊 贡献分析:
   - 质量评分: ${contribution_analysis.quality_score.toFixed(1)}/100
   - 一致性评分: ${contribution_analysis.consistency_score.toFixed(1)}/100
   - 真实性评分: ${contribution_analysis.authenticity_score.toFixed(1)}/100
   - 技术能力: ${contribution_analysis.technical_competence.toFixed(1)}/100
   - 协作能力: ${contribution_analysis.collaboration_score.toFixed(1)}/100

🚨 风险评估:
   - 女巫攻击概率: ${risk_assessment.sybil_probability.toFixed(1)}%
   - 风险因子: ${risk_assessment.risk_factors.length > 0 ? risk_assessment.risk_factors.join(', ') : '无'}
   - 置信度: ${risk_assessment.confidence_level.toFixed(1)}%
        `);
    }

    // 性能测试
    async performanceTest() {
        console.log('\n🏃‍♂️ 性能测试开始...');
        
        const testUser = 'octocat';
        const iterations = 5;
        const times = [];

        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await this.engine.analyzeUser(testUser);
            const duration = Date.now() - start;
            times.push(duration);
            console.log(`测试 ${i + 1}: ${duration}ms`);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log(`\n📈 性能结果:
   - 平均响应时间: ${avgTime.toFixed(0)}ms
   - 最快响应: ${minTime}ms
   - 最慢响应: ${maxTime}ms
   - 缓存效果: ${times[0] > times[times.length - 1] ? '生效' : '未知'}
        `);
    }

    // 准确性验证
    async accuracyTest() {
        console.log('\n🎯 准确性验证测试...');
        
        // 测试不同类型的账户
        const testCases = [
            {
                username: 'torvalds',
                expectedProfile: 'high_quality_veteran',
                description: '高质量资深开发者'
            },
            {
                username: 'octocat',
                expectedProfile: 'demo_account',
                description: 'GitHub演示账号'
            }
        ];

        for (const testCase of testCases) {
            const analysis = await this.engine.analyzeUser(testCase.username);
            const score = analysis.contribution_analysis.authenticity_score;
            
            console.log(`🧪 ${testCase.description} (${testCase.username})`);
            console.log(`   真实性评分: ${score.toFixed(1)}/100`);
            
            if (testCase.expectedProfile === 'high_quality_veteran' && score < 70) {
                console.log(`   ⚠️  评分可能偏低，需要调优`);
            } else if (testCase.expectedProfile === 'demo_account' && score > 90) {
                console.log(`   ⚠️  评分可能偏高，需要调优`);
            } else {
                console.log(`   ✅ 评分符合预期`);
            }
        }
    }

    // 错误处理测试
    async errorHandlingTest() {
        console.log('\n🛡️ 错误处理测试...');
        
        const errorCases = [
            'nonexistent_user_12345',
            '',
            'user-with-hyphen',
            'Very_Long_Username_That_Might_Cause_Issues'
        ];

        for (const username of errorCases) {
            try {
                await this.engine.analyzeUser(username);
                console.log(`⚠️  ${username}: 意外成功`);
            } catch (error) {
                console.log(`✅ ${username}: 错误处理正常 - ${error.message.slice(0, 50)}...`);
            }
        }
    }
}

// 运行测试
async function runAllTests() {
    const tester = new GitHubAnalysisTest();
    
    try {
        await tester.runTests();
        await tester.performanceTest();
        await tester.accuracyTest();
        await tester.errorHandlingTest();
        
        console.log('\n🎉 所有测试完成!');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    // 加载环境变量
    require('dotenv').config();
    
    if (!process.env.GITHUB_TOKEN) {
        console.error('❌ 请设置GITHUB_TOKEN环境变量');
        process.exit(1);
    }
    
    runAllTests();
}

module.exports = GitHubAnalysisTest;