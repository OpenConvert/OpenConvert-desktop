// Application configuration
// Update these URLs when you set up your repository

export const APP_CONFIG = {
    // GitHub repository information
    repository: {
        owner: 'yourusername',  // Replace with your GitHub username
        name: 'openconvert',    // Replace with your repository name
    },

    // External links
    links: {
        // Support URL (includes documentation, issues, and community)
        get support() {
            return `https://github.com/${APP_CONFIG.repository.owner}/${APP_CONFIG.repository.name}#readme`
        },
        
        // GitHub releases API endpoint (auto-generated from repository info)
        get releasesApi() {
            return `https://api.github.com/repos/${APP_CONFIG.repository.owner}/${APP_CONFIG.repository.name}/releases/latest`
        },
        
        // GitHub releases page (auto-generated from repository info)
        get releasesPage() {
            return `https://github.com/${APP_CONFIG.repository.owner}/${APP_CONFIG.repository.name}/releases`
        },

        // Repository home page
        get repository() {
            return `https://github.com/${APP_CONFIG.repository.owner}/${APP_CONFIG.repository.name}`
        },
    },
}
