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