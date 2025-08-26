const express = require('express');
const { Octokit } = require("@octokit/rest");
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// GitHub分析引擎 - 核心服务
class GitHubAnalysisEngine {
    constructor(githubToken) {
        this.octokit = new Octokit({
            auth: githubToken,
            userAgent: 'Contri-AI/1.0.0'
        });
        this.analysisCache = new Map();
        this.rateLimitRemaining = 5000;
    }

    // 1. 用户全面分析
    async analyzeUser(username) {
        const cacheKey = `user:${username}`;
        
        // 检查缓存
        if (this.analysisCache.has(cacheKey)) {
            const cached = this.analysisCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
                return cached.data;
            }
        }

        try {
            console.log(`🔍 开始分析GitHub用户: ${username}`);
            
            // 并行获取用户基础信息
            const [userProfile, userRepos, userEvents] = await Promise.all([
                this.octokit.users.getByUsername({ username }),
                this.octokit.repos.listForUser({ username, per_page: 100, sort: 'updated' }),
                this.octokit.activity.listPublicEventsForUser({ username, per_page: 100 })
            ]);

            // 分析用户基础指标
            const basicMetrics = this.calculateBasicMetrics(userProfile.data, userRepos.data);
            
            // 分析代码贡献质量
            const contributionQuality = await this.analyzeContributionQuality(userRepos.data, username);
            
            // 分析活跃度模式
            const activityPatterns = this.analyzeActivityPatterns(userEvents.data);
            
            // 计算真实性评分
            const authenticityScore = this.calculateAuthenticityScore(
                basicMetrics, contributionQuality, activityPatterns
            );

            const analysis = {
                user_profile: {
                    username: username,
                    account_age_days: Math.floor((Date.now() - new Date(userProfile.data.created_at)) / (1000 * 60 * 60 * 24)),
                    public_repos: userProfile.data.public_repos,
                    followers: userProfile.data.followers,
                    following: userProfile.data.following,
                    total_commits: basicMetrics.totalCommits,
                    primary_languages: basicMetrics.primaryLanguages.slice(0, 5),
                    bio: userProfile.data.bio,
                    location: userProfile.data.location,
                    company: userProfile.data.company
                },
                contribution_analysis: {
                    quality_score: contributionQuality.averageQuality,
                    consistency_score: activityPatterns.consistencyScore,
                    authenticity_score: authenticityScore.overall,
                    technical_competence: contributionQuality.technicalScore,
                    collaboration_score: contributionQuality.collaborationScore
                },
                recent_activity: activityPatterns.recentEvents.slice(0, 10),
                repository_insights: contributionQuality.topRepositories.slice(0, 5),
                risk_assessment: {
                    sybil_probability: authenticityScore.sybilProbability,
                    risk_factors: authenticityScore.riskFactors,
                    confidence_level: authenticityScore.confidence
                },
                analysis_metadata: {
                    analyzed_at: new Date().toISOString(),
                    rate_limit_remaining: this.rateLimitRemaining,
                    data_completeness: this.calculateDataCompleteness(userProfile.data, userRepos.data)
                }
            };

            // 缓存结果
            this.analysisCache.set(cacheKey, {
                data: analysis,
                timestamp: Date.now()
            });

            console.log(`✅ 用户分析完成: ${username}, 真实性评分: ${authenticityScore.overall.toFixed(1)}`);
            return analysis;

        } catch (error) {
            console.error(`❌ 用户分析失败 ${username}:`, error.message);
            throw new Error(`GitHub用户分析失败: ${error.message}`);
        }
    }

    // 2. 计算基础指标
    calculateBasicMetrics(userProfile, repositories) {
        const languages = {};
        let totalCommits = 0;
        let totalStars = 0;
        let totalForks = 0;

        repositories.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
            totalStars += repo.stargazers_count;
            totalForks += repo.forks_count;
            
            // 估算提交数 (基于仓库大小和活跃度)
            const estimatedCommits = Math.min(repo.size / 10, 100) + 
                                   (repo.stargazers_count > 0 ? Math.log10(repo.stargazers_count + 1) * 10 : 0);
            totalCommits += Math.floor(estimatedCommits);
        });

        // 按使用频次排序编程语言
        const primaryLanguages = Object.entries(languages)
            .sort(([,a], [,b]) => b - a)
            .map(([lang]) => lang);

        return {
            totalCommits,
            totalStars,
            totalForks,
            primaryLanguages,
            repositoryCount: repositories.length,
            averageRepoStars: repositories.length > 0 ? totalStars / repositories.length : 0
        };
    }

    // 3. 分析贡献质量
    async analyzeContributionQuality(repositories, username) {
        const qualityMetrics = [];
        const topRepositories = [];
        let totalCollaborativeRepos = 0;

        // 分析前20个最活跃的仓库
        const activeRepos = repositories
            .filter(repo => !repo.fork && repo.size > 0)
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
            .slice(0, 20);

        for (const repo of activeRepos) {
            try {
                // 获取仓库贡献统计
                const [commits, contributors, languages] = await Promise.all([
                    this.octokit.repos.listCommits({
                        owner: repo.owner.login,
                        repo: repo.name,
                        author: username,
                        per_page: 50
                    }).catch(() => ({ data: [] })),
                    this.octokit.repos.listContributors({
                        owner: repo.owner.login,
                        repo: repo.name,
                        per_page: 10
                    }).catch(() => ({ data: [] })),
                    this.octokit.repos.listLanguages({
                        owner: repo.owner.login,
                        repo: repo.name
                    }).catch(() => ({ data: {} }))
                ]);

                // 计算仓库质量分数
                const repoQuality = this.calculateRepositoryQuality(repo, commits.data, contributors.data, languages.data);
                qualityMetrics.push(repoQuality);

                // 检查是否为协作项目
                if (contributors.data.length > 1) {
                    totalCollaborativeRepos++;
                }

                topRepositories.push({
                    name: repo.full_name,
                    stars: repo.stargazers_count,
                    language: repo.language,
                    commits: commits.data.length,
                    quality_score: repoQuality.overall,
                    is_collaborative: contributors.data.length > 1,
                    last_commit: commits.data[0]?.commit.committer.date || repo.updated_at
                });

            } catch (error) {
                console.warn(`⚠️  无法分析仓库 ${repo.full_name}: ${error.message}`);
            }
        }

        // 计算综合质量分数
        const averageQuality = qualityMetrics.length > 0 
            ? qualityMetrics.reduce((sum, m) => sum + m.overall, 0) / qualityMetrics.length 
            : 0;

        const technicalScore = this.calculateTechnicalCompetence(qualityMetrics, repositories);
        const collaborationScore = Math.min(100, (totalCollaborativeRepos / Math.max(activeRepos.length, 1)) * 100);

        return {
            averageQuality,
            technicalScore,
            collaborationScore,
            topRepositories: topRepositories.sort((a, b) => b.quality_score - a.quality_score),
            analyzedRepos: activeRepos.length
        };
    }

    // 4. 计算仓库质量
    calculateRepositoryQuality(repo, commits, contributors, languages) {
        let codeQuality = 0;
        let documentationQuality = 0;
        let maintenanceScore = 0;
        let communityEngagement = 0;

        // 代码质量指标
        const languageCount = Object.keys(languages).length;
        const hasReadme = repo.name.toLowerCase().includes('readme') || repo.description;
        const recentActivity = new Date(repo.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        codeQuality = Math.min(100, 
            (repo.size / 1000 * 10) + // 代码量
            (languageCount > 1 ? 20 : 10) + // 多语言使用
            (repo.stargazers_count > 0 ? Math.log10(repo.stargazers_count + 1) * 5 : 0) // 社区认可
        );

        // 文档质量
        documentationQuality = (hasReadme ? 40 : 0) + 
                             (repo.description ? 30 : 0) + 
                             (repo.homepage ? 20 : 0) +
                             (commits.some(c => c.commit.message.toLowerCase().includes('doc')) ? 10 : 0);

        // 维护质量
        maintenanceScore = (recentActivity ? 50 : 0) + 
                          (commits.length > 10 ? 30 : commits.length * 3) +
                          (repo.open_issues_count < 10 ? 20 : Math.max(0, 20 - repo.open_issues_count));

        // 社区参与度
        communityEngagement = Math.min(100,
            (contributors.length - 1) * 10 + // 其他贡献者
            (repo.forks_count * 5) + // Fork数量
            (repo.watchers_count * 2) // 关注者
        );

        const overall = (codeQuality * 0.3 + documentationQuality * 0.2 + 
                        maintenanceScore * 0.3 + communityEngagement * 0.2);

        return {
            overall: Math.min(100, overall),
            code_quality: Math.min(100, codeQuality),
            documentation: Math.min(100, documentationQuality),
            maintenance: Math.min(100, maintenanceScore),
            community: Math.min(100, communityEngagement)
        };
    }

    // 5. 分析活跃度模式
    analyzeActivityPatterns(events) {
        const eventsByType = {};
        const eventsByDay = {};
        const recentEvents = [];

        events.forEach(event => {
            // 统计事件类型
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
            
            // 统计每日活动
            const day = event.created_at.split('T')[0];
            eventsByDay[day] = (eventsByDay[day] || 0) + 1;

            // 记录最近事件
            if (recentEvents.length < 20) {
                recentEvents.push({
                    type: event.type,
                    repo: event.repo?.name || 'Unknown',
                    created_at: event.created_at,
                    public: event.public
                });
            }
        });

        // 计算一致性分数
        const dayCount = Object.keys(eventsByDay).length;
        const avgEventsPerDay = events.length / Math.max(dayCount, 1);
        const consistencyScore = Math.min(100, 
            (dayCount > 7 ? 50 : dayCount * 7) + // 活跃天数
            (avgEventsPerDay > 1 ? 30 : avgEventsPerDay * 30) + // 平均频次
            (Object.keys(eventsByType).length > 3 ? 20 : Object.keys(eventsByType).length * 6) // 事件多样性
        );

        return {
            consistencyScore,
            eventsByType,
            eventsByDay,
            recentEvents,
            totalEvents: events.length,
            activeDays: dayCount,
            averageEventsPerDay: avgEventsPerDay
        };
    }

    // 6. 计算技术能力
    calculateTechnicalCompetence(qualityMetrics, repositories) {
        if (qualityMetrics.length === 0) return 0;

        const avgCodeQuality = qualityMetrics.reduce((sum, m) => sum + m.code_quality, 0) / qualityMetrics.length;
        const languageDiversity = new Set(repositories.map(r => r.language).filter(Boolean)).size;
        const complexProjectsCount = repositories.filter(r => r.size > 1000 && r.stargazers_count > 5).length;
        
        return Math.min(100,
            avgCodeQuality * 0.4 +
            Math.min(40, languageDiversity * 8) +
            Math.min(30, complexProjectsCount * 10)
        );
    }

    // 7. 计算真实性评分
    calculateAuthenticityScore(basicMetrics, contributionQuality, activityPatterns) {
        const riskFactors = [];
        let authenticityScore = 100;

        // 账户年龄检查
        const accountAgeDays = basicMetrics.accountAgeDays || 0;
        if (accountAgeDays < 90) {
            riskFactors.push('account_too_new');
            authenticityScore -= 20;
        }

        // 活动模式检查
        if (activityPatterns.consistencyScore < 30) {
            riskFactors.push('inconsistent_activity');
            authenticityScore -= 15;
        }

        // 仓库质量检查
        if (contributionQuality.averageQuality < 40) {
            riskFactors.push('low_quality_contributions');
            authenticityScore -= 25;
        }

        // 社交指标检查
        const followerRatio = basicMetrics.followers / Math.max(basicMetrics.following, 1);
        if (followerRatio < 0.1 && basicMetrics.followers < 10) {
            riskFactors.push('low_social_engagement');
            authenticityScore -= 10;
        }

        // 协作能力检查
        if (contributionQuality.collaborationScore < 20) {
            riskFactors.push('limited_collaboration');
            authenticityScore -= 10;
        }

        const finalScore = Math.max(0, authenticityScore);
        const sybilProbability = Math.max(0, 100 - finalScore);
        
        return {
            overall: finalScore,
            sybilProbability,
            riskFactors,
            confidence: this.calculateConfidence(basicMetrics, activityPatterns)
        };
    }

    // 8. 计算数据完整性
    calculateDataCompleteness(userProfile, repositories) {
        let completeness = 0;
        
        if (userProfile.bio) completeness += 15;
        if (userProfile.location) completeness += 10;
        if (userProfile.company) completeness += 10;
        if (userProfile.email) completeness += 15;
        if (repositories.length > 0) completeness += 20;
        if (repositories.some(r => r.description)) completeness += 10;
        if (repositories.some(r => r.homepage)) completeness += 10;
        if (userProfile.followers > 0) completeness += 10;

        return Math.min(100, completeness);
    }

    // 9. 计算置信度
    calculateConfidence(basicMetrics, activityPatterns) {
        let confidence = 50; // 基础置信度

        if (activityPatterns.totalEvents > 50) confidence += 20;
        if (basicMetrics.repositoryCount > 5) confidence += 15;
        if (activityPatterns.activeDays > 30) confidence += 15;

        return Math.min(100, confidence);
    }

    // 10. 获取分析统计
    getAnalysisStats() {
        return {
            cached_analyses: this.analysisCache.size,
            rate_limit_remaining: this.rateLimitRemaining,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage()
        };
    }
}

// Express API服务
const app = express();
app.use(cors());
app.use(express.json());

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每个IP最多100次请求
});
app.use('/api/', limiter);

// 初始化GitHub分析引擎
const githubEngine = new GitHubAnalysisEngine(process.env.GITHUB_TOKEN);

// API路由
app.get('/api/github/analyze/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const analysis = await githubEngine.analyzeUser(username);
        
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

// 批量分析API
app.post('/api/github/analyze-batch', async (req, res) => {
    try {
        const { usernames } = req.body;
        
        if (!Array.isArray(usernames) || usernames.length > 10) {
            return res.status(400).json({
                success: false,
                error: '用户名列表无效或超过限制(最多10个)'
            });
        }

        const results = await Promise.allSettled(
            usernames.map(username => githubEngine.analyzeUser(username))
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

// 系统状态API
app.get('/api/github/stats', (req, res) => {
    res.json({
        success: true,
        data: githubEngine.getAnalysisStats()
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 GitHub分析服务启动成功，端口: ${PORT}`);
    console.log(`📊 API文档: http://localhost:${PORT}/api/github/`);
});

module.exports = { GitHubAnalysisEngine, app };