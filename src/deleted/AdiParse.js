// AdiParse - Minimal utility service for ADI URL parsing and BankOnLedger URL generation
// This is a simplified extraction from the Accumulate Wallet project

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