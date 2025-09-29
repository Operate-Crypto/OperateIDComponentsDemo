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