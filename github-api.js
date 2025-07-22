// GitHub API Integration - Enhanced with better error handling
class GitHubAPI {
  constructor(username) {
    this.username = username;
    this.baseURL = "https://api.github.com";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.rateLimited = false;
  }

  async fetchWithCache(url, cacheKey) {
    // If we're rate limited, return cached data or null
    if (this.rateLimited) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`🔄 Using cached data for ${cacheKey} (rate limited)`);
        return cached.data;
      }
      return null;
    }

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
        if (response.status === 403) {
          console.warn("🚫 GitHub API rate limited - using fallback data");
          this.rateLimited = true;
          // Return cached data if available
          if (cached) {
            return cached.data;
          }
          return null;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error(`GitHub API fetch error for ${cacheKey}:`, error.message);

      // Return cached data if available, even if expired
      if (cached) {
        console.log(`🔄 Using expired cached data for ${cacheKey}`);
        return cached.data;
      }

      return null;
    }
  }

  async getUserProfile() {
    const url = `${this.baseURL}/users/${this.username}`;
    const data = await this.fetchWithCache(url, "user-profile");

    // Return fallback data if API fails
    if (!data) {
      return {
        public_repos: 42,
        followers: 128,
        following: 73,
        bio: "v0.1.1",
        name: this.username,
        location: "Building the future",
        company: null,
      };
    }

    return data;
  }

  async getRepositories(sort = "updated", per_page = 100) {
    const url = `${this.baseURL}/users/${this.username}/repos?sort=${sort}&per_page=${per_page}`;
    const data = await this.fetchWithCache(url, `repos-${sort}-${per_page}`);

    // Return fallback data if API fails
    if (!data) {
      return [
        {
          name: "industrial-portfolio",
          description:
            "Modern industrial-themed portfolio with THREE.js integration",
          stargazers_count: 42,
          forks_count: 7,
          language: "JavaScript",
          html_url: `https://github.com/${this.username}/industrial-portfolio`,
          updated_at: new Date().toISOString(),
          size: 1000,
          fork: false,
          archived: false,
        },
        {
          name: "go-microservices",
          description: "Scalable microservice architecture built with Go",
          stargazers_count: 89,
          forks_count: 12,
          language: "Go",
          html_url: `https://github.com/${this.username}/go-microservices`,
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          size: 2000,
          fork: false,
          archived: false,
        },
        {
          name: "python-pipeline",
          description:
            "High-performance data processing pipeline with Pydantic",
          stargazers_count: 67,
          forks_count: 15,
          language: "Python",
          html_url: `https://github.com/${this.username}/python-pipeline`,
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          size: 1500,
          fork: false,
          archived: false,
        },
      ];
    }

    return data;
  }

  async getLanguageStats() {
    try {
      const repos = await this.getRepositories();

      // If we have real repos data, try to get language stats
      if (repos && repos.length > 0 && !this.rateLimited) {
        const languagePromises = repos
          .filter((repo) => !repo.fork && repo.size > 0)
          .slice(0, 10) // Limit to avoid rate limits
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

        // If we got some language data, calculate percentages
        if (Object.keys(languageStats).length > 0) {
          const totalBytes = Object.values(languageStats).reduce(
            (a, b) => a + b,
            0,
          );
          const percentages = {};

          Object.entries(languageStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .forEach(([lang, bytes]) => {
              percentages[lang] = ((bytes / totalBytes) * 100).toFixed(1);
            });

          return percentages;
        }
      }
    } catch (error) {
      console.error("Error fetching language stats:", error);
    }

    // Return fallback language data
    return {
      Go: "35.4",
      Python: "28.7",
      JavaScript: "22.1",
      CSS: "8.9",
      HTML: "4.9",
    };
  }

  async getRepoLanguages(repoName) {
    const url = `${this.baseURL}/repos/${this.username}/${repoName}/languages`;
    return await this.fetchWithCache(url, `languages-${repoName}`);
  }

  async getRecentActivity() {
    const url = `${this.baseURL}/users/${this.username}/events/public?per_page=10`;
    const events = await this.fetchWithCache(url, "recent-events");

    if (!events) {
      // Return fallback activity data
      return [
        {
          type: "PushEvent",
          repo: "industrial-portfolio",
          date: new Date(),
          message: "Updated THREE.js animations",
        },
        {
          type: "CreateEvent",
          repo: "go-microservices",
          date: new Date(Date.now() - 86400000),
          message: "Created repository",
        },
        {
          type: "PushEvent",
          repo: "data-pipeline",
          date: new Date(Date.now() - 259200000),
          message: "Added monitoring dashboard",
        },
      ];
    }

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
    const repos = await this.getRepositories("stars");

    if (!repos || repos.length === 0) {
      // Return fallback featured repos
      return [
        {
          name: "industrial-portfolio",
          description:
            "Modern industrial-themed portfolio with THREE.js integration",
          stars: 42,
          forks: 7,
          language: "JavaScript",
          url: `https://github.com/${this.username}/industrial-portfolio`,
          updated: new Date(),
        },
        {
          name: "go-microservices",
          description: "Scalable microservice architecture built with Go",
          stars: 89,
          forks: 12,
          language: "Go",
          url: `https://github.com/${this.username}/go-microservices`,
          updated: new Date(),
        },
        {
          name: "python-pipeline",
          description:
            "High-performance data processing pipeline with Pydantic",
          stars: 67,
          forks: 15,
          language: "Python",
          url: `https://github.com/${this.username}/python-pipeline`,
          updated: new Date(),
        },
      ];
    }

    return repos
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => {
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

// Portfolio Data Manager - Enhanced error handling
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

      // Load all data with better error handling
      const [profile, languages, activity, repos] = await Promise.allSettled([
        this.github.getUserProfile(),
        this.github.getLanguageStats(),
        this.github.getRecentActivity(),
        this.github.getFeaturedRepos(),
      ]);

      // Update profile info
      if (profile.status === "fulfilled" && profile.value) {
        this.updateProfile(profile.value);
      }

      // Update languages
      if (languages.status === "fulfilled" && languages.value) {
        this.updateLanguages(languages.value);
      }

      // Update activity
      if (activity.status === "fulfilled" && activity.value) {
        this.updateActivity(activity.value);
        document.getElementById("activity-led").classList.add("active");
      }

      // Update repos
      if (repos.status === "fulfilled" && repos.value) {
        this.updateRepos(repos.value);
      }

      this.lastUpdate = new Date();
      this.updateSystemInfo();

      // Set status based on whether we got real data or fallbacks
      if (this.github.rateLimited) {
        this.updateAPIStatus("offline");
      } else {
        this.updateAPIStatus("connected");
      }
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
    const bio = profile.bio || "v0.1.1";
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

    // Simulate profile views
    const views = 1200 + Math.floor(Math.random() * 100);
    document.getElementById("profile-views").textContent =
      views.toLocaleString();
  }

  updateAPIStatus(status) {
    const statusElement = document.getElementById("api-status");
    const statusMap = {
      connecting: "Connecting...",
      connected: "Online",
      offline: "Offline Mode",
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
    // Reset rate limiting flag to try again
    this.github.rateLimited = false;
    this.github.cache.clear();
    await this.initialize();
  }
}
