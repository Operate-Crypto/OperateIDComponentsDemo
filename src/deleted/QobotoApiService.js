/**
 * QobotoApiService - Fetches data from Qoboto API
 *
 * The API returns a list of section objects. This service automatically:
 * 1. Calls the API: GET /api/v1/Qoboto/GetDataValue/All?DataAccountUrl={identityUrl}
 * 2. Parses the response list
 * 3. Finds the object where name="main"
 * 4. Extracts logoUrl, sectionMain1Description, sectionMain1Background2ImageUrl
 * 5. Caches the result for 5 minutes
 */
class QobotoApiService {
    constructor() {
        this.baseUrl = "https://localhost:7033"; // Default API base URL
        this.cache = new Map(); // Simple cache for API responses
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
        this.debugMode = true; // Enable debug logging by default to help troubleshoot
    }

    /**
     * Enable or disable debug logging
     * @param {boolean} enabled - Whether to enable debug logs
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        if (enabled) {
            console.log("QobotoApiService: Debug mode enabled");
        }
    }

    /**
     * Debug log helper
     */
    _debug(...args) {
        if (this.debugMode) {
            console.log('[QobotoApiService]', ...args);
        }
    }

    /**
     * Error log helper (always logs)
     */
    _error(...args) {
        console.error('[QobotoApiService]', ...args);
    }

    /**
     * Warning log helper (always logs)
     */
    _warn(...args) {
        console.warn('[QobotoApiService]', ...args);
    }

    /**
     * Clean text by replacing problematic characters
     * @param {string} text - The text to clean
     * @returns {string} Cleaned text
     */
    _cleanText(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        // Replace common problematic characters
        return text
            .replace(/�/g, '') // Remove replacement character
            .replace(/\u00A0/g, ' ') // Replace non-breaking space with regular space
            .replace(/\u2019/g, "'") // Replace right single quotation mark
            .replace(/\u201C/g, '"') // Replace left double quotation mark
            .replace(/\u201D/g, '"') // Replace right double quotation mark
            .replace(/\u2013/g, '-') // Replace en dash
            .replace(/\u2014/g, '--') // Replace em dash
            .replace(/\u2026/g, '...') // Replace horizontal ellipsis
            .trim(); // Remove leading/trailing whitespace
    }

    /**
     * Set custom API base URL
     * @param {string} baseUrl - The base URL for the API
     */
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get data for an identity from Qoboto API
     * @param {string} identityUrl - The full identity URL (e.g., "sunstream.acme")
     * @returns {Promise<object|null>} The data object or null if failed
     */
    async getIdentityData(identityUrl) {
        const cacheKey = `qoboto_${identityUrl}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            // Construct API URL with correct format
            // /api/v1/Qoboto/GetDataValue/All?DataAccountUrl=sunstream.acme
            const apiUrl = `${this.baseUrl}/api/v1/Qoboto/GetDataValue/All?DataAccountUrl=${encodeURIComponent(identityUrl)}`;

            this._debug(`Fetching Qoboto data from: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json; charset=utf-8',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });

            if (!response.ok) {
                this._warn(`API request failed: ${response.status} ${response.statusText}`);
                return null;
            }

            const responseText = await response.text();
            this._debug(`Raw response text (first 200 chars):`, responseText.substring(0, 200));

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                this._error(`Failed to parse response as JSON:`, parseError);
                return null;
            }

            // Debug: Log the response type and content
            this._debug(`Response type: ${typeof responseData}`);
            this._debug(`Response is array: ${Array.isArray(responseData)}`);
            this._debug(`Response data:`, responseData);

            // Handle if response is a JSON string instead of parsed object
            if (typeof responseData === 'string') {
                this._debug(`Response is a string, attempting to parse...`);
                try {
                    responseData = JSON.parse(responseData);
                    this._debug(`Successfully parsed string to object. Type: ${typeof responseData}, Is array: ${Array.isArray(responseData)}`);
                } catch (parseError) {
                    this._error(`Failed to parse response string:`, parseError);
                    return null;
                }
            }

            // The API returns a list - find the object with name="main"
            const mainData = this._findMainSection(responseData);

            if (!mainData) {
                this._warn(`No "main" section found in Qoboto API response for ${identityUrl}`);
                this._warn(`Response data structure:`, responseData);
                return null;
            }

            this._debug(`Found main section:`, mainData);

            // Cache the parsed main section data
            this.cache.set(cacheKey, {
                data: mainData,
                timestamp: Date.now()
            });

            return mainData;
        } catch (error) {
            this._error(`Error fetching Qoboto data for ${identityUrl}:`, error);
            return null;
        }
    }

    /**
     * Find the "main" section from the API response list
     * @param {Array|Object} responseData - The API response (expected to be an array)
     * @returns {object|null} The main section object or null if not found
     */
    _findMainSection(responseData) {
        this._debug(`_findMainSection called with data type: ${typeof responseData}, isArray: ${Array.isArray(responseData)}`);

        // Handle if response is already an object (backward compatibility)
        if (responseData && !Array.isArray(responseData) && typeof responseData === 'object') {
            this._debug(`Response is a single object. Checking name property...`);
            this._debug(`Object keys:`, Object.keys(responseData));

            if (responseData.name === 'main') {
                this._debug(`Single object has name="main", returning it`);
                return responseData;
            }
            // If it's a single object but not named "main", return it anyway for backward compatibility
            this._debug(`Single object does not have name="main", but returning it anyway (backward compatibility)`);
            return responseData;
        }

        // Handle array response - find object with name="main"
        if (Array.isArray(responseData)) {
            this._debug(`Response is an array with ${responseData.length} items`);

            // Log all items in the array for debugging
            responseData.forEach((item, index) => {
                this._debug(`Array item ${index}:`, {
                    name: item?.name,
                    type: typeof item,
                    keys: Object.keys(item || {})
                });
            });

            const mainSection = responseData.find(item => {
                const isMain = item && item.name === 'main';
                this._debug(`Checking item with name="${item?.name}": isMain=${isMain}`);
                return isMain;
            });

            if (mainSection) {
                this._debug(`Found main section:`, mainSection);
                return mainSection;
            }

            // If no "main" found but there's at least one item, log available sections
            if (responseData.length > 0) {
                const availableSections = responseData.map(item => item?.name || 'unnamed').join(', ');
                this._error(`Could not find "main" section. Available sections: ${availableSections}`);
            } else {
                this._error(`Response array is empty`);
            }
        }

        this._error(`Could not find main section. Response data:`, responseData);
        return null;
    }

    /**
     * Get logo URL for an identity
     * @param {string} identityUrl - The identity URL (e.g., "sunstream.acme")
     * @returns {Promise<string|null>} The logo URL or null
     */
    async getLogoUrl(identityUrl) {
        const data = await this.getIdentityData(identityUrl);
        const logoUrl = data?.logoUrl || null;
        this._debug(`getLogoUrl for ${identityUrl}: ${logoUrl}`);
        return logoUrl;
    }

    /**
     * Get section main description for an identity
     * @param {string} identityUrl - The identity URL (e.g., "sunstream.acme")
     * @returns {Promise<string|null>} The description or null
     */
    async getSectionMain1Description(identityUrl) {
        const data = await this.getIdentityData(identityUrl);
        const rawDescription = data?.sectionMain1Description || null;
        const cleanedDescription = rawDescription ? this._cleanText(rawDescription) : null;
        this._debug(`getSectionMain1Description for ${identityUrl}: ${cleanedDescription?.substring(0, 100)}...`);
        return cleanedDescription;
    }

    /**
     * Get section main background image URL for an identity
     * @param {string} identityUrl - The identity URL (e.g., "sunstream.acme")
     * @returns {Promise<string|null>} The background image URL or null
     */
    async getSectionMain1Background2ImageUrl(identityUrl) {
        const data = await this.getIdentityData(identityUrl);
        return data?.sectionMain1Background2ImageUrl || null;
    }

    /**
     * Get all main data for an identity
     * @param {string} identityUrl - The identity URL (e.g., "sunstream.acme")
     * @returns {Promise<object>} Object with logoUrl, description, and backgroundImageUrl
     */
    async getAllMainData(identityUrl) {
        const data = await this.getIdentityData(identityUrl);
        const rawDescription = data?.sectionMain1Description || null;
        const cleanedDescription = rawDescription ? this._cleanText(rawDescription) : null;

        return {
            logoUrl: data?.logoUrl || null,
            sectionMain1Description: cleanedDescription,
            sectionMain1Background2ImageUrl: data?.sectionMain1Background2ImageUrl || null,
            rawData: data // Include raw data for advanced usage
        };
    }

    /**
     * Clear cache for a specific identity or all cache
     * @param {string} identityUrl - Optional identity URL to clear specific cache
     */
    clearCache(identityUrl = null) {
        if (identityUrl) {
            this.cache.delete(`qoboto_${identityUrl}`);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Enable/disable local development mode with mock data
     * @param {boolean} enabled - Whether to use mock data
     */
    setDevelopmentMode(enabled = true) {
        this.developmentMode = enabled;
        if (enabled) {
            console.log("QobotoApiService: Development mode enabled - using mock data");
        }
    }

    /**
     * Get mock data for development/testing
     * @param {string} identityUrl - The identity URL (e.g., "sunstream.acme")
     * @returns {object} Mock data object (simulates the "main" section)
     */
    getMockData(identityUrl) {
        const identityName = identityUrl.split('.')[0].replace('acc://', '');
        return {
            name: 'main', // Simulate the main section
            logoUrl: `https://pub-1c0e543900fc40318aa4c4aec39fb352.r2.dev/logo-${identityName}.png`,
            sectionMain1Description: `Welcome to ${identityName}'s digital identity space. This is a comprehensive platform for managing your digital presence and accessing various blockchain services.`,
            sectionMain1Background2ImageUrl: `https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80`,
            lastUpdated: new Date().toISOString(),
            identityUrl: identityUrl
        };
    }

    /**
     * Override getIdentityData for development mode
     */
    async getIdentityDataWithMock(identityUrl) {
        if (this.developmentMode) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 200));
            return this.getMockData(identityUrl);
        }
        return this.getIdentityData(identityUrl);
    }
}

// Create global instance
const qobotoApiService = new QobotoApiService();

// Enable development mode by default for testing
qobotoApiService.setDevelopmentMode(true);