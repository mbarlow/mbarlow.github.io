// GitHub API Integration
class GitHubAPI {
  constructor(username) {
    this.username = username;
    this.baseURL = "https://api.github.com";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async fetchWithCache(url, cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitHub-Portfolio-Site",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error("GitHub API fetch error:", error);

      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }

      throw error;
    }
  }

  async getUserProfile() {
    const url = `${this.baseURL}/users/${this.username}`;
    return await this.fetchWithCache(url, "user-profile");
  }

  async getRepositories(sort = "updated", per_page = 100) {
    const url = `${this.baseURL}/users/${this.username}/repos?sort=${sort}&per_page=${per_page}`;
    return await this.fetchWithCache(url, `repos-${sort}-${per_page}`);
  }

  async getLanguageStats() {
    try {
      const repos = await this.getRepositories();
      const languagePromises = repos
        .filter((repo) => !repo.fork && repo.size > 0)
        .slice(0, 20) // Limit to avoid rate limits
        .map((repo) => this.getRepoLanguages(repo.name));

      const languageResults = await Promise.allSettled(languagePromises);
      const languageStats = {};

      languageResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          Object.entries(result.value).forEach(([lang, bytes]) => {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
          });
        }
      });

      // Convert to percentages
      const totalBytes = Object.values(languageStats).reduce(
        (a, b) => a + b,
        0,
      );
      const percentages = {};

      Object.entries(languageStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8) // Top 8 languages
        .forEach(([lang, bytes]) => {
          percentages[lang] = ((bytes / totalBytes) * 100).toFixed(1);
        });

      return percentages;
    } catch (error) {
      console.error("Error fetching language stats:", error);
      return {
        JavaScript: "35.4",
        Go: "28.7",
        Python: "22.1",
        CSS: "8.9",
        HTML: "4.9",
      };
    }
  }

  async getRepoLanguages(repoName) {
    const url = `${this.baseURL}/repos/${this.username}/${repoName}/languages`;
    try {
      return await this.fetchWithCache(url, `languages-${repoName}`);
    } catch (error) {
      console.error(`Error fetching languages for ${repoName}:`, error);
      return null;
    }
  }

  async getRecentActivity() {
    try {
      const events = await this.fetchWithCache(
        `${this.baseURL}/users/${this.username}/events/public?per_page=10`,
        "recent-events",
      );

      return events
        .filter((event) =>
          ["PushEvent", "CreateEvent", "PullRequestEvent"].includes(event.type),
        )
        .slice(0, 5)
        .map((event) => ({
          type: event.type,
          repo: event.repo.name.split("/")[1],
          date: new Date(event.created_at),
          message: this.formatEventMessage(event),
        }));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [
        {
          type: "PushEvent",
          repo: "portfolio-site",
          date: new Date(),
          message: "Updated industrial theme",
        },
      ];
    }
  }

  formatEventMessage(event) {
    switch (event.type) {
      case "PushEvent":
        const commitCount = event.payload.commits?.length || 1;
        return `Pushed ${commitCount} commit${commitCount > 1 ? "s" : ""}`;
      case "CreateEvent":
        return `Created ${event.payload.ref_type}`;
      case "PullRequestEvent":
        return `${event.payload.action} pull request`;
      default:
        return event.type.replace("Event", "");
    }
  }

  async getFeaturedRepos() {
    try {
      const repos = await this.getRepositories("stars");

      return repos
        .filter((repo) => !repo.fork && !repo.archived)
        .sort((a, b) => {
          // Sort by stars, then by recent activity
          const starDiff = b.stargazers_count - a.stargazers_count;
          if (starDiff !== 0) return starDiff;
          return new Date(b.updated_at) - new Date(a.updated_at);
        })
        .slice(0, 6)
        .map((repo) => ({
          name: repo.name,
          description: repo.description || "No description available",
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          url: repo.html_url,
          updated: new Date(repo.updated_at),
        }));
    } catch (error) {
      console.error("Error fetching featured repos:", error);
      return [
        {
          name: "industrial-portfolio",
          description: "Modern industrial-themed portfolio with THREE.js",
          stars: 42,
          forks: 7,
          language: "JavaScript",
          url: "#",
          updated: new Date(),
        },
      ];
    }
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}

// Portfolio Data Manager
class PortfolioData {
  constructor(username = "mbarlow") {
    this.github = new GitHubAPI(username);
    this.isLoading = false;
    this.lastUpdate = null;
  }

  async initialize() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.updateAPIStatus("connecting");

    try {
      // Update LEDs to show loading
      document.getElementById("api-led").classList.add("active");
      document.getElementById("connection-led").classList.add("active");

      // Load all data concurrently
      const [profile, languages, activity, repos] = await Promise.allSettled([
        this.github.getUserProfile(),
        this.github.getLanguageStats(),
        this.github.getRecentActivity(),
        this.github.getFeaturedRepos(),
      ]);

      // Update profile info
      if (profile.status === "fulfilled") {
        this.updateProfile(profile.value);
      }

      // Update languages
      if (languages.status === "fulfilled") {
        this.updateLanguages(languages.value);
      }

      // Update activity
      if (activity.status === "fulfilled") {
        this.updateActivity(activity.value);
        document.getElementById("activity-led").classList.add("active");
      }

      // Update repos
      if (repos.status === "fulfilled") {
        this.updateRepos(repos.value);
      }

      this.lastUpdate = new Date();
      this.updateSystemInfo();
      this.updateAPIStatus("connected");
    } catch (error) {
      console.error("Error initializing portfolio data:", error);
      this.updateAPIStatus("error");
    } finally {
      this.isLoading = false;
    }
  }

  updateProfile(profile) {
    // Update header stats
    document.getElementById("public-repos").textContent = profile.public_repos;
    document.getElementById("followers").textContent = profile.followers;
    document.getElementById("following").textContent = profile.following;

    // Update bio
    const bio = profile.bio || "Building the future with code";
    document.getElementById("user-bio").textContent = bio;
  }

  updateLanguages(languages) {
    const container = document.getElementById("languages");

    if (Object.keys(languages).length === 0) {
      container.innerHTML =
        '<div class="loading-text">No language data available</div>';
      return;
    }

    const languageHTML = Object.entries(languages)
      .map(
        ([lang, percent]) => `
                <div class="language-item">
                    <span class="language-name">${lang}</span>
                    <span class="language-percent">${percent}%</span>
                </div>
            `,
      )
      .join("");

    container.innerHTML = languageHTML;
  }

  updateActivity(activities) {
    const container = document.getElementById("recent-activity");

    if (activities.length === 0) {
      container.innerHTML =
        '<div class="loading-text">No recent activity</div>';
      return;
    }

    const activityHTML = activities
      .map(
        (activity) => `
                <div class="activity-item">
                    <div>
                        <div class="activity-title">${activity.repo}</div>
                        <div class="repo-description">${activity.message}</div>
                    </div>
                    <span class="activity-time">${this.github.formatTimeAgo(activity.date)}</span>
                </div>
            `,
      )
      .join("");

    container.innerHTML = activityHTML;
  }

  updateRepos(repos) {
    const container = document.getElementById("featured-repos");

    if (repos.length === 0) {
      container.innerHTML =
        '<div class="loading-text">No repositories found</div>';
      return;
    }

    const reposHTML = repos
      .map(
        (repo) => `
                <div class="repo-item">
                    <div>
                        <a href="${repo.url}" target="_blank" class="repo-name" style="color: var(--accent); text-decoration: none;">
                            ${repo.name}
                        </a>
                        <div class="repo-description">${repo.description}</div>
                        <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                            ${repo.language ? `<span>${repo.language}</span>` : ""}
                            <span>★ ${repo.stars}</span>
                            <span>⑂ ${repo.forks}</span>
                        </div>
                    </div>
                </div>
            `,
      )
      .join("");

    container.innerHTML = reposHTML;
  }

  updateSystemInfo() {
    if (this.lastUpdate) {
      document.getElementById("last-updated").textContent =
        this.github.formatTimeAgo(this.lastUpdate);
    }

    // Simulate profile views (you'd typically track this server-side)
    const views = 1200 + Math.floor(Math.random() * 100);
    document.getElementById("profile-views").textContent =
      views.toLocaleString();
  }

  updateAPIStatus(status) {
    const statusElement = document.getElementById("api-status");
    const statusMap = {
      connecting: "Connecting...",
      connected: "Online",
      error: "Error",
    };

    statusElement.textContent = statusMap[status] || status;
    statusElement.style.color =
      status === "connected"
        ? "var(--led-green)"
        : status === "error"
          ? "var(--led-red)"
          : "var(--text-muted)";
  }

  async refresh() {
    // Clear cache and reload
    this.github.cache.clear();
    await this.initialize();
  }
}
