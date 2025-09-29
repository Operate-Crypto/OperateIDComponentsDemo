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