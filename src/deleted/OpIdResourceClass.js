class OpIdResourceClass {
    constructor(opIdInfo) {
        this.opIdInfo = opIdInfo;
        this._dataCache = {}; // Cache for all data types
        this._customOverrides = {}; // For manual overrides
    }

    async logoUrl() {
        // Check for manual override first
        if (this._customOverrides.logoUrl) {
            return this._customOverrides.logoUrl;
        }

        // Check cache
        if (this._dataCache.logoUrl) {
            return this._dataCache.logoUrl;
        }

        try {
            // Get identity URL from opIdInfo (using the simple form like "sunstream.acme")
            const identityUrl = this._getSimpleIdentityUrl();

            // Fetch from Qoboto API
            const logoUrl = await qobotoApiService.getLogoUrl(identityUrl);

            if (logoUrl) {
                this._dataCache.logoUrl = logoUrl;
                return logoUrl;
            }
        } catch (error) {
            console.error("Error fetching logo from API:", error);
        }

        // Default logo fallback
        const defaultLogoUrl = "https://pub-1c0e543900fc40318aa4c4aec39fb352.r2.dev/logo.png";
        this._dataCache.logoUrl = defaultLogoUrl;
        return defaultLogoUrl;
    }

    _getSimpleIdentityUrl() {
        // Get simple form like "sunstream.acme" for API calls
        const identityUrl = this.opIdInfo.identityUrl;
        // Remove acc:// prefix if present
        return identityUrl.replace('acc://', '');
    }

    async sectionMain1Description() {
        // Check for manual override first
        if (this._customOverrides.sectionMain1Description) {
            return this._customOverrides.sectionMain1Description;
        }

        // Check cache
        if (this._dataCache.sectionMain1Description) {
            return this._dataCache.sectionMain1Description;
        }

        try {
            // Get identity URL from opIdInfo
            const identityUrl = this._getSimpleIdentityUrl();

            // Fetch from Qoboto API
            const description = await qobotoApiService.getSectionMain1Description(identityUrl);

            if (description) {
                this._dataCache.sectionMain1Description = description;
                return description;
            }
        } catch (error) {
            console.error("Error fetching description from API:", error);
        }

        // Default description fallback
        const defaultDescription = `Welcome to ${this.opIdInfo.identityName}'s digital identity dashboard.`;
        this._dataCache.sectionMain1Description = defaultDescription;
        return defaultDescription;
    }

    async sectionMain1Background2ImageUrl() {
        // Check for manual override first
        if (this._customOverrides.sectionMain1Background2ImageUrl) {
            return this._customOverrides.sectionMain1Background2ImageUrl;
        }

        // Check cache
        if (this._dataCache.sectionMain1Background2ImageUrl) {
            return this._dataCache.sectionMain1Background2ImageUrl;
        }

        try {
            // Get identity URL from opIdInfo
            const identityUrl = this._getSimpleIdentityUrl();

            // Fetch from Qoboto API
            const backgroundImageUrl = await qobotoApiService.getSectionMain1Background2ImageUrl(identityUrl);

            if (backgroundImageUrl) {
                this._dataCache.sectionMain1Background2ImageUrl = backgroundImageUrl;
                return backgroundImageUrl;
            }
        } catch (error) {
            console.error("Error fetching background image from API:", error);
        }

        // Default background image fallback
        const defaultBackgroundUrl = "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80";
        this._dataCache.sectionMain1Background2ImageUrl = defaultBackgroundUrl;
        return defaultBackgroundUrl;
    }

    async getAllMainData() {
        const identityUrl = this._getSimpleIdentityUrl();

        try {
            // Get all data in one API call for efficiency
            const allData = await qobotoApiService.getAllMainData(identityUrl);

            // Update cache
            if (allData.logoUrl) this._dataCache.logoUrl = allData.logoUrl;
            if (allData.sectionMain1Description) this._dataCache.sectionMain1Description = allData.sectionMain1Description;
            if (allData.sectionMain1Background2ImageUrl) this._dataCache.sectionMain1Background2ImageUrl = allData.sectionMain1Background2ImageUrl;

            return {
                logoUrl: allData.logoUrl || await this.logoUrl(),
                sectionMain1Description: allData.sectionMain1Description || await this.sectionMain1Description(),
                sectionMain1Background2ImageUrl: allData.sectionMain1Background2ImageUrl || await this.sectionMain1Background2ImageUrl(),
                rawData: allData.rawData
            };
        } catch (error) {
            console.error("Error fetching all main data:", error);
            // Return individual cached/default values
            return {
                logoUrl: await this.logoUrl(),
                sectionMain1Description: await this.sectionMain1Description(),
                sectionMain1Background2ImageUrl: await this.sectionMain1Background2ImageUrl(),
                rawData: null
            };
        }
    }

    // Method to manually set custom values for testing/development
    setCustomLogoUrl(logoUrl) {
        this._customOverrides.logoUrl = logoUrl;
    }

    setCustomDescription(description) {
        this._customOverrides.sectionMain1Description = description;
    }

    setCustomBackgroundImageUrl(backgroundImageUrl) {
        this._customOverrides.sectionMain1Background2ImageUrl = backgroundImageUrl;
    }

    // Clear cache to force refresh from API
    clearCache(dataType = null) {
        if (dataType) {
            delete this._dataCache[dataType];
        } else {
            this._dataCache = {};
        }

        // Also clear API cache for this identity
        qobotoApiService.clearCache(this._getSimpleIdentityUrl());
    }

    // Clear all overrides
    clearOverrides() {
        this._customOverrides = {};
    }
}