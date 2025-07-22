// scripts/fetch-github-data.js
const fs = require("fs");
const path = require("path");

class GitHubDataFetcher {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.username = process.env.USERNAME;
    this.baseURL = "https://api.github.com";

    if (!this.token) {
      throw new Error("GITHUB_TOKEN environment variable is required");
    }

    if (!this.username) {
      throw new Error("USERNAME environment variable is required");
    }
  }

  async fetchAPI(url) {
    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Portfolio-Data-Fetcher",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  async getUserProfile() {
    const url = `${this.baseURL}/users/${this.username}`;
    const profile = await this.fetchAPI(url);

    return {
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      company: profile.company,
      blog: profile.blog,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  async getRepositories() {
    const url = `${this.baseURL}/users/${this.username}/repos?sort=updated&per_page=100`;
    const repos = await this.fetchAPI(url);

    return repos
      .filter((repo) => !repo.fork && !repo.archived)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        size: repo.size,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        topics: repo.topics || [],
      }));
  }

  async getLanguageStats(repos) {
    console.log("Fetching language statistics...");

    const languageStats = {};
    const promises = repos
      .filter((repo) => repo.size > 0)
      .slice(0, 20) // Limit to avoid rate limits
      .map(async (repo) => {
        try {
          const url = `${this.baseURL}/repos/${this.username}/${repo.name}/languages`;
          const languages = await this.fetchAPI(url);
          return languages;
        } catch (error) {
          console.warn(
            `Failed to fetch languages for ${repo.name}:`,
            error.message,
          );
          return null;
        }
      });

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        Object.entries(result.value).forEach(([lang, bytes]) => {
          languageStats[lang] = (languageStats[lang] || 0) + bytes;
        });
      }
    });

    // Convert to percentages
    const totalBytes = Object.values(languageStats).reduce((a, b) => a + b, 0);
    const percentages = {};

    if (totalBytes > 0) {
      Object.entries(languageStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .forEach(([lang, bytes]) => {
          percentages[lang] = parseFloat(
            ((bytes / totalBytes) * 100).toFixed(1),
          );
        });
    }

    return percentages;
  }

  async getRecentActivity() {
    console.log("Fetching recent activity...");

    const url = `${this.baseURL}/users/${this.username}/events/public?per_page=15`;
    const events = await this.fetchAPI(url);

    return events
      .filter((event) =>
        [
          "PushEvent",
          "CreateEvent",
          "PullRequestEvent",
          "IssuesEvent",
        ].includes(event.type),
      )
      .slice(0, 8)
      .map((event) => ({
        type: event.type,
        repo: event.repo.name.split("/")[1],
        created_at: event.created_at,
        message: this.formatEventMessage(event),
      }));
  }

  formatEventMessage(event) {
    switch (event.type) {
      case "PushEvent":
        const commitCount = event.payload.commits?.length || 1;
        return `Pushed ${commitCount} commit${commitCount > 1 ? "s" : ""}`;
      case "CreateEvent":
        const refType = event.payload.ref_type;
        return `Created ${refType}${event.payload.ref ? ` ${event.payload.ref}` : ""}`;
      case "PullRequestEvent":
        return `${event.payload.action} pull request`;
      case "IssuesEvent":
        return `${event.payload.action} issue`;
      default:
        return event.type.replace("Event", "");
    }
  }

  async getFeaturedRepos(repos) {
    return repos
      .sort((a, b) => {
        // Sort by stars, then by recent activity
        const starDiff = b.stargazers_count - a.stargazers_count;
        if (starDiff !== 0) return starDiff;
        return new Date(b.updated_at) - new Date(a.updated_at);
      })
      .slice(0, 6);
  }

  async generatePortfolioData() {
    console.log(`Starting data fetch for user: ${this.username}`);

    try {
      // Fetch all data concurrently
      const [profile, repos] = await Promise.all([
        this.getUserProfile(),
        this.getRepositories(),
      ]);

      console.log(`Found ${repos.length} repositories`);

      // Get derived data
      const [languages, activity, featuredRepos] = await Promise.all([
        this.getLanguageStats(repos),
        this.getRecentActivity(),
        this.getFeaturedRepos(repos),
      ]);

      const portfolioData = {
        profile,
        repositories: {
          total: repos.length,
          featured: featuredRepos,
          all: repos,
        },
        languages,
        activity,
        stats: {
          totalStars: repos.reduce(
            (sum, repo) => sum + repo.stargazers_count,
            0,
          ),
          totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
          languageCount: Object.keys(languages).length,
          repoCount: repos.length,
        },
        lastUpdated: new Date().toISOString(),
        generatedBy: "GitHub Actions",
      };

      console.log("Portfolio data generated successfully:");
      console.log(`- ${portfolioData.repositories.total} repositories`);
      console.log(`- ${portfolioData.stats.totalStars} total stars`);
      console.log(`- ${Object.keys(portfolioData.languages).length} languages`);
      console.log(`- ${portfolioData.activity.length} recent activities`);

      return portfolioData;
    } catch (error) {
      console.error("Error generating portfolio data:", error);
      throw error;
    }
  }

  async saveToFile(data) {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "portfolio.json");

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write the data
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Portfolio data saved to: ${filePath}`);

    // Also create a minified version for production
    const minFilePath = path.join(dataDir, "portfolio.min.json");
    fs.writeFileSync(minFilePath, JSON.stringify(data));
    console.log(`Minified data saved to: ${minFilePath}`);
  }
}

// Main execution
async function main() {
  try {
    const fetcher = new GitHubDataFetcher();
    const data = await fetcher.generatePortfolioData();
    await fetcher.saveToFile(data);

    console.log("✅ Portfolio data update completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Portfolio data update failed:", error);
    process.exit(1);
  }
}

// Run the script
main();
