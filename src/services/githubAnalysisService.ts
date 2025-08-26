// src/services/githubAnalysisService.ts
// GitHub分析服务 - 适配CodeSandbox环境

interface GitHubUser {
  login: string;
  id: number;
  created_at: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
  location: string | null;
  company: string | null;
  email: string | null;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  owner: { login: string };
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  size: number;
  updated_at: string;
  description: string | null;
  homepage: string | null;
  open_issues_count: number;
  fork: boolean;
}

interface ContributionAnalysis {
  quality_score: number;
  authenticity_score: number;
  technical_competence: number;
  collaboration_score: number;
  consistency_score: number;
}

interface GitHubAnalysisResult {
  user_profile: {
    username: string;
    account_age_days: number;
    public_repos: number;
    followers: number;
    following: number;
    total_commits: number;
    primary_languages: string[];
    bio: string | null;
    location: string | null;
    company: string | null;
  };
  contribution_analysis: ContributionAnalysis;
  recent_activity: any[];
  repository_insights: Array<{
    name: string;
    stars: number;
    language: string | null;
    quality_score: number;
    is_collaborative: boolean;
  }>;
  risk_assessment: {
    sybil_probability: number;
    risk_factors: string[];
    confidence_level: number;
  };
  analysis_metadata: {
    analyzed_at: string;
    data_completeness: number;
    analysis_duration_ms: number;
  };
}

class GitHubAnalysisService {
  private static instance: GitHubAnalysisService;
  private cache = new Map<string, { data: GitHubAnalysisResult; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): GitHubAnalysisService {
    if (!GitHubAnalysisService.instance) {
      GitHubAnalysisService.instance = new GitHubAnalysisService();
    }
    return GitHubAnalysisService.instance;
  }

  // 主要分析方法
  async analyzeUser(username: string): Promise<GitHubAnalysisResult> {
    const cacheKey = `user:${username}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    const startTime = Date.now();
    console.log(`🔍 开始分析GitHub用户: ${username}`);

    try {
      // 获取用户基础信息和仓库
      const [userProfile, repositories] = await Promise.all([
        this.fetchUserProfile(username),
        this.fetchUserRepositories(username)
      ]);

      // 计算各项指标
      const basicMetrics = this.calculateBasicMetrics(userProfile, repositories);
      const contributionQuality = this.analyzeContributionQuality(repositories, username);
      const authenticityScore = this.calculateAuthenticityScore(basicMetrics, contributionQuality);

      const analysis: GitHubAnalysisResult = {
        user_profile: {
          username: username,
          account_age_days: Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          public_repos: userProfile.public_repos,
          followers: userProfile.followers,
          following: userProfile.following,
          total_commits: basicMetrics.totalCommits,
          primary_languages: basicMetrics.primaryLanguages.slice(0, 5),
          bio: userProfile.bio,
          location: userProfile.location,
          company: userProfile.company
        },
        contribution_analysis: {
          quality_score: contributionQuality.averageQuality,
          authenticity_score: authenticityScore.overall,
          technical_competence: contributionQuality.technicalScore,
          collaboration_score: contributionQuality.collaborationScore,
          consistency_score: basicMetrics.consistencyScore
        },
        recent_activity: [], // 简化实现
        repository_insights: contributionQuality.topRepositories.slice(0, 5),
        risk_assessment: {
          sybil_probability: authenticityScore.sybilProbability,
          risk_factors: authenticityScore.riskFactors,
          confidence_level: authenticityScore.confidence
        },
        analysis_metadata: {
          analyzed_at: new Date().toISOString(),
          data_completeness: this.calculateDataCompleteness(userProfile, repositories),
          analysis_duration_ms: Date.now() - startTime
        }
      };

      // 缓存结果
      this.cache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      });

      console.log(`✅ 用户分析完成: ${username}, 真实性评分: ${authenticityScore.overall.toFixed(1)}`);
      return analysis;

    } catch (error) {
      console.error(`❌ 用户分析失败 ${username}:`, error);
      throw new Error(`GitHub用户分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取用户资料
  private async fetchUserProfile(username: string): Promise<GitHubUser> {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Contri-AI-Demo/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('用户不存在');
      }
      throw new Error(`GitHub API错误: ${response.status}`);
    }

    return response.json();
  }

  // 获取用户仓库
  private async fetchUserRepositories(username: string, per_page: number = 100): Promise<GitHubRepo[]> {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=${per_page}&sort=updated&type=owner`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Contri-AI-Demo/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`获取仓库列表失败: ${response.status}`);
    }

    return response.json();
  }

  // 计算基础指标
  private calculateBasicMetrics(userProfile: GitHubUser, repositories: GitHubRepo[]) {
    const languages: Record<string, number> = {};
    let totalCommits = 0;
    let totalStars = 0;

    repositories.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
      totalStars += repo.stargazers_count;
      
      // 估算提交数（基于仓库大小和受欢迎程度）
      const estimatedCommits = Math.min(repo.size / 10, 100) + 
                             (repo.stargazers_count > 0 ? Math.log10(repo.stargazers_count + 1) * 10 : 0);
      totalCommits += Math.floor(estimatedCommits);
    });

    const primaryLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .map(([lang]) => lang);

    // 计算一致性分数
    const recentRepos = repositories
      .filter(repo => new Date(repo.updated_at) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000))
      .length;
    const consistencyScore = Math.min(100, (recentRepos / Math.max(repositories.length, 1)) * 100 + 
                                     (primaryLanguages.length > 1 ? 20 : 0));

    return {
      totalCommits,
      totalStars,
      primaryLanguages,
      repositoryCount: repositories.length,
      averageRepoStars: repositories.length > 0 ? totalStars / repositories.length : 0,
      consistencyScore
    };
  }

  // 分析贡献质量
  private analyzeContributionQuality(repositories: GitHubRepo[], username: string) {
    const qualityMetrics: Array<{overall: number}> = [];
    const topRepositories: Array<{
      name: string;
      stars: number;
      language: string | null;
      quality_score: number;
      is_collaborative: boolean;
    }> = [];

    let totalCollaborativeRepos = 0;

    // 分析活跃仓库
    const activeRepos = repositories
      .filter(repo => !repo.fork && repo.size > 0)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 20);

    activeRepos.forEach(repo => {
      const repoQuality = this.calculateRepositoryQuality(repo);
      qualityMetrics.push(repoQuality);

      // 简化的协作检测（基于stars和forks）
      const isCollaborative = repo.forks_count > 0 || repo.stargazers_count > 1;
      if (isCollaborative) {
        totalCollaborativeRepos++;
      }

      topRepositories.push({
        name: repo.full_name,
        stars: repo.stargazers_count,
        language: repo.language,
        quality_score: repoQuality.overall,
        is_collaborative: isCollaborative
      });
    });

    const averageQuality = qualityMetrics.length > 0 
      ? qualityMetrics.reduce((sum, m) => sum + m.overall, 0) / qualityMetrics.length 
      : 0;

    const technicalScore = this.calculateTechnicalCompetence(repositories);
    const collaborationScore = Math.min(100, (totalCollaborativeRepos / Math.max(activeRepos.length, 1)) * 100);

    return {
      averageQuality,
      technicalScore,
      collaborationScore,
      topRepositories: topRepositories.sort((a, b) => b.quality_score - a.quality_score)
    };
  }

  // 计算仓库质量
  private calculateRepositoryQuality(repo: GitHubRepo): {overall: number} {
    let score = 0;

    // 代码量评分
    score += Math.min(30, repo.size / 1000 * 10);

    // 文档评分
    if (repo.description) score += 20;
    if (repo.homepage) score += 10;

    // 社区认可度
    if (repo.stargazers_count > 0) {
      score += Math.min(25, Math.log10(repo.stargazers_count + 1) * 5);
    }

    // 维护活跃度
    const recentActivity = new Date(repo.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (recentActivity) score += 15;

    return { overall: Math.min(100, score) };
  }

  // 计算技术能力
  private calculateTechnicalCompetence(repositories: GitHubRepo[]): number {
    const languageDiversity = new Set(
      repositories.map(r => r.language).filter(Boolean)
    ).size;

    const complexProjects = repositories.filter(
      r => r.size > 1000 && r.stargazers_count > 5
    ).length;

    const avgStars = repositories.length > 0 
      ? repositories.reduce((sum, r) => sum + r.stargazers_count, 0) / repositories.length 
      : 0;

    return Math.min(100,
      Math.min(40, languageDiversity * 8) +
      Math.min(30, complexProjects * 10) +
      Math.min(30, Math.log10(avgStars + 1) * 10)
    );
  }

  // 计算真实性评分
  private calculateAuthenticityScore(basicMetrics: any, contributionQuality: any) {
    const riskFactors: string[] = [];
    let authenticityScore = 100;

    // 仓库数量检查
    if (basicMetrics.repositoryCount < 3) {
      riskFactors.push('few_repositories');
      authenticityScore -= 15;
    }

    // 代码质量检查
    if (contributionQuality.averageQuality < 40) {
      riskFactors.push('low_quality_code');
      authenticityScore -= 20;
    }

    // 技术多样性检查
    if (basicMetrics.primaryLanguages.length < 2) {
      riskFactors.push('limited_language_diversity');
      authenticityScore -= 10;
    }

    // 协作能力检查
    if (contributionQuality.collaborationScore < 20) {
      riskFactors.push('limited_collaboration');
      authenticityScore -= 15;
    }

    // 社区认可度检查
    if (basicMetrics.averageRepoStars < 1) {
      riskFactors.push('low_community_recognition');
      authenticityScore -= 10;
    }

    const finalScore = Math.max(0, authenticityScore);
    const sybilProbability = Math.max(0, 100 - finalScore);
    
    return {
      overall: finalScore,
      sybilProbability,
      riskFactors,
      confidence: Math.min(100, 60 + (basicMetrics.repositoryCount > 10 ? 20 : 0) + 
                          (contributionQuality.averageQuality > 70 ? 20 : 0))
    };
  }

  // 计算数据完整性
  private calculateDataCompleteness(userProfile: GitHubUser, repositories: GitHubRepo[]): number {
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

  // 获取分析统计
  getAnalysisStats() {
    return {
      cached_analyses: this.cache.size,
      uptime_seconds: Math.floor(process.uptime?.() || Date.now() / 1000),
      memory_usage: 'N/A in browser environment'
    };
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
  }
}

export default GitHubAnalysisService;