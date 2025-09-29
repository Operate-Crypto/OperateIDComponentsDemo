/**
 * OperateID Assembly - Complete JavaScript Bundle
 *
 * This file contains all the OperateID components combined into a single JavaScript file.
 * It provides functionality to generate BankOnLedger and Qoboto URLs from identity URLs,
 * fetch real data from APIs, and manage digital identity information.
 *
 * Usage:
 * - Include this single file in your HTML: <script src="src/js/operateIdAssembly.js"></script>
 * - Use AdiParse.* methods for all functionality
 *
 * Main API:
 * - AdiParse.getBankOnLedgerUrl(identityUrl)
 * - AdiParse.getQobotoUrl(identityUrl)
 * - AdiParse.getLogoUrl(identityUrl)
 * - AdiParse.getSectionMain1Description(identityUrl)
 * - AdiParse.getSectionMain1Background2ImageUrl(identityUrl)
 * - AdiParse.getAllMainData(identityUrl)
 *
 * @version 1.0.0
 * @created 2024
 */

// =============================================================================
// NETWORK NAME SERVICE
// =============================================================================

class NetworkNameServiceClass {
    constructor() {
        this._currentNetwork = "mainnet"; // Default to mainnet
    }

    currentNetworkName() {
        return this._currentNetwork;
    }

    switchNetworkName(networkName) {
        this._currentNetwork = networkName;
    }

    currentNetwork_IsMainnet() {
        return (this.currentNetworkName() == "mainnet");
    }
}

const networkNameService = new NetworkNameServiceClass();

// =============================================================================
// IDENTITY FORMATTER
// =============================================================================

class IdentityFormatterClass {
    formatIdentity(identityUrl) {
        if (!identityUrl) return identityUrl;
        identityUrl = identityUrl.toLowerCase();
        if (!identityUrl.includes("acc://")) identityUrl = "acc://" + identityUrl;
        if (!identityUrl.includes(".acme")) identityUrl = identityUrl + ".acme";
        return identityUrl;
    }
}

const identityFormatter = new IdentityFormatterClass();

// =============================================================================
// ADI STRING HELPER
// =============================================================================

class AdiStringHelper {
    static parseAdi2(adiUrl) {
        if (!adiUrl || adiUrl.trim() === "") return null;

        adiUrl = AdiStringHelper.fixAdiUrl(adiUrl);

        if (!adiUrl.startsWith("acc://")) adiUrl = "acc://" + adiUrl;

        var adi = {}
        adi.url = adiUrl;
        adi.path = adi.url.substring(6);
        var arr1 = adi.path.split(".");
        adi.name = arr1[0];
        var arr_remaining = arr1[1] || "";
        adi.rootUrl = "acc://" + adi.name + ".acme";
        adi.subPath = arr_remaining.length > 5 ? arr_remaining.substring(5) : "";
        return adi;
    }

    static fixAdiUrl(url) {
        if (!url) return url;
        url = url.toLowerCase();
        // Remove any trailing slashes
        url = url.replace(/\/+$/, '');
        return url;
    }

    static getLastSegment(adiUrl) {
        if (!adiUrl) return "";
        const segments = adiUrl.split("/");
        return segments[segments.length - 1];
    }
}

// =============================================================================
// ADI URL CLASS
// =============================================================================

class AdiUrlClass {
    static createByUrl(url) {
        var adi = new AdiUrlClass()
        adi.init_ByAdiUrl(url);
        return adi;
    }

    static createByIdentityName(name) {
        var adi = new AdiUrlClass()
        adi.init_ByAdiUrl("acc://" + name + ".acme");
        return adi;
    }

    constructor() {
        this.pathEnd = "";
        this._calc_Server();
    }

    _calc_Server() {
        this.networkName = networkNameService.currentNetworkName();
        this.serverName = (this.networkName == "mainnet" ? "" : this.networkName);
    }

    init_ByAdiUrl(url) {
        this.url = url;
        this.adiParsed = AdiStringHelper.parseAdi2(this.url);
        if (this.adiParsed) {
            this.name = this.adiParsed.name;
            this.path = this.adiParsed.path;
            this.pathEnd = this.adiParsed.subPath;
        }
    }

    calculate_app_Url(appSite) {
        this._calc_Server();
        return "https://" + this.name + "." + appSite + "/" + this.pathEnd + "?current-network=" + this.networkName;
    }

    qoboto_Url() {
        return this.calculate_app_Url("Qoboto.com");
    }

    bankOnLedger_Url() {
        return this.calculate_app_Url("BankOnLedger.com");
    }
}

// =============================================================================
// OPID INFO CLASS
// =============================================================================

class OpIdInfoClass {
    init() {
        this.adiInfo = AdiUrlClass.createByUrl(this.identityUrl);
    }

    constructor() {
        this.identityTrain = "";
        this.identityName = "";
        this.identityUrl = "";
    }
}

// =============================================================================
// OPID INFO FACTORY
// =============================================================================

class OpIdInfoFactoryClass {
    createByIdentityUrl(identityUrl) {
        identityUrl = identityFormatter.formatIdentity(identityUrl);

        const info = new OpIdInfoClass();
        const match = identityUrl.match(/^acc:\/\/([^\/\.]+)\.acme(?:\/(.*))?$/);
        if (match) {
            const identityName = match[1];
            const path = match[2] || "";
            const identityTrain = [identityName, ...path.split("/").filter(Boolean)].join(".");
            info.identityName = identityName;
            info.identityTrain = identityTrain;
        } else {
            console.error("Invalid identity url format : " + identityUrl);
            return null;
        }
        info.identityUrl = identityUrl;
        info.init();
        return info;
    }

    createByIdentityName(identityName) {
        const info = new OpIdInfoClass();
        info.identityName = identityName;
        info.identityTrain = identityName;
        info.identityUrl = identityFormatter.formatIdentity(identityName);
        info.init();
        return info;
    }
}

const opIdInfoFactory = new OpIdInfoFactoryClass();

// =============================================================================
// QOBOTO API SERVICE
// =============================================================================

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

// =============================================================================
// OPID RESOURCE CLASS
// =============================================================================

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

// =============================================================================
// OPID RESOURCE FACTORY
// =============================================================================

class OpIdResourceFactoryClass {
    createByIdentityUrl(identityUrl) {
        const info = opIdInfoFactory.createByIdentityUrl(identityUrl);
        if (info == null) return null;
        var result = new OpIdResourceClass(info);
        return result;
    }

    createByIdentityName(identityName) {
        const info = opIdInfoFactory.createByIdentityName(identityName);
        if (info == null) return null;
        var result = new OpIdResourceClass(info);
        return result;
    }
}

const opIdResourceFactory = new OpIdResourceFactoryClass();

// =============================================================================
// OPID RESOURCE REPOSITORY
// =============================================================================

class OpIdResourceRepositoryClass {
    getOpIdResource_createByIdentityUrl(identityUrl) {
        return opIdResourceFactory.createByIdentityUrl(identityUrl);
    }

    getOpIdResource_createByIdentityName(identityName) {
        return opIdResourceFactory.createByIdentityName(identityName);
    }
}

// =============================================================================
// OPID SERVICE
// =============================================================================

class OpIdServiceClass {
    constructor() {
        this.opIdResourceRepository = new OpIdResourceRepositoryClass();
    }
}

// Create a global service object similar to the original structure
const opId$ = {
    service: new OpIdServiceClass()
};

// =============================================================================
// MAIN ADIPARSE API
// =============================================================================

// Load dependencies in correct order
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { AdiParse, opId$ };
} else {
    // Browser environment - classes are already defined
}

// Main utility class for easy usage
class AdiParse {
    /**
     * Get the BankOnLedger URL for a given identity
     * @param {string} identityUrl - The identity URL (e.g., "acc://sunstream.acme" or "sunstream.acme")
     * @returns {string|null} The BankOnLedger URL or null if invalid
     */
    static getBankOnLedgerUrl(identityUrl) {
        try {
            const opIdResource = opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
            if (opIdResource && opIdResource.opIdInfo && opIdResource.opIdInfo.adiInfo) {
                return opIdResource.opIdInfo.adiInfo.bankOnLedger_Url();
            }
            return null;
        } catch (error) {
            console.error("Error generating BankOnLedger URL:", error);
            return null;
        }
    }

    /**
     * Get the Qoboto URL for a given identity
     * @param {string} identityUrl - The identity URL (e.g., "acc://sunstream.acme" or "sunstream.acme")
     * @returns {string|null} The Qoboto URL or null if invalid
     */
    static getQobotoUrl(identityUrl) {
        try {
            const opIdResource = opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
            if (opIdResource && opIdResource.opIdInfo && opIdResource.opIdInfo.adiInfo) {
                return opIdResource.opIdInfo.adiInfo.qoboto_Url();
            }
            return null;
        } catch (error) {
            console.error("Error generating Qoboto URL:", error);
            return null;
        }
    }

    /**
     * Get the logo URL for a given identity
     * @param {string} identityUrl - The identity URL (e.g., "acc://sunstream.acme" or "sunstream.acme")
     * @returns {Promise<string|null>} The logo URL or null if invalid
     */
    static async getLogoUrl(identityUrl) {
        try {
            const opIdResource = opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
            if (opIdResource) {
                return await opIdResource.logoUrl();
            }
            return null;
        } catch (error) {
            console.error("Error generating logo URL:", error);
            return null;
        }
    }

    /**
     * Get the main section description for a given identity
     * @param {string} identityUrl - The identity URL (e.g., "acc://sunstream.acme" or "sunstream.acme")
     * @returns {Promise<string|null>} The section description or null if invalid
     */
    static async getSectionMain1Description(identityUrl) {
        try {
            const opIdResource = opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
            if (opIdResource) {
                return await opIdResource.sectionMain1Description();
            }
            return null;
        } catch (error) {
            console.error("Error getting section description:", error);
            return null;
        }
    }

    /**
     * Get the main section background image URL for a given identity
     * @param {string} identityUrl - The identity URL (e.g., "acc://sunstream.acme" or "sunstream.acme")
     * @returns {Promise<string|null>} The background image URL or null if invalid
     */
    static async getSectionMain1Background2ImageUrl(identityUrl) {
        try {
            const opIdResource = opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
            if (opIdResource) {
                return await opIdResource.sectionMain1Background2ImageUrl();
            }
            return null;
        } catch (error) {
            console.error("Error getting background image URL:", error);
            return null;
        }
    }

    /**
     * Get all main data for a given identity in one call
     * @param {string} identityUrl - The identity URL (e.g., "acc://sunstream.acme" or "sunstream.acme")
     * @returns {Promise<object|null>} Object with logoUrl, description, backgroundImageUrl, and rawData
     */
    static async getAllMainData(identityUrl) {
        try {
            const opIdResource = opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
            if (opIdResource) {
                return await opIdResource.getAllMainData();
            }
            return null;
        } catch (error) {
            console.error("Error getting all main data:", error);
            return null;
        }
    }

    /**
     * Get the full opIdResource object for advanced usage
     * @param {string} identityUrl - The identity URL (e.g., "acc://sunstream.acme" or "sunstream.acme")
     * @returns {object|null} The opIdResource object or null if invalid
     */
    static getOpIdResource(identityUrl) {
        try {
            return opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
        } catch (error) {
            console.error("Error creating OpIdResource:", error);
            return null;
        }
    }

    /**
     * Set the network name (default is "mainnet")
     * @param {string} networkName - The network name ("mainnet", "kermit", "fozzie", etc.)
     */
    static setNetwork(networkName) {
        networkNameService.switchNetworkName(networkName);
    }

    /**
     * Get the current network name
     * @returns {string} The current network name
     */
    static getNetwork() {
        return networkNameService.currentNetworkName();
    }

    /**
     * Configure the Qoboto API base URL
     * @param {string} baseUrl - The API base URL (e.g., "https://api.qoboto.com")
     */
    static setApiBaseUrl(baseUrl) {
        qobotoApiService.setBaseUrl(baseUrl);
    }

    /**
     * Enable or disable development mode (uses mock data when enabled)
     * @param {boolean} enabled - Whether to use development mode with mock data
     */
    static setDevelopmentMode(enabled = true) {
        qobotoApiService.setDevelopmentMode(enabled);
    }

    /**
     * Enable or disable debug logging for API calls
     * @param {boolean} enabled - Whether to enable debug logging
     */
    static setDebugMode(enabled = true) {
        qobotoApiService.setDebugMode(enabled);
    }

    /**
     * Clear all cached data for a specific identity or all identities
     * @param {string} identityUrl - Optional identity URL to clear specific cache
     */
    static clearCache(identityUrl = null) {
        if (identityUrl) {
            const opIdResource = opId$.service.opIdResourceRepository.getOpIdResource_createByIdentityUrl(identityUrl);
            if (opIdResource) {
                opIdResource.clearCache();
            }
        } else {
            qobotoApiService.clearCache();
        }
    }
}

// =============================================================================
// CONSOLE INITIALIZATION MESSAGE
// =============================================================================

console.log("✅ OperateID Assembly loaded successfully!");
console.log("📋 Available APIs: AdiParse.getBankOnLedgerUrl(), getQobotoUrl(), getLogoUrl(), getAllMainData()");
console.log("🔧 Configuration: AdiParse.setNetwork(), setApiBaseUrl(), setDebugMode()");