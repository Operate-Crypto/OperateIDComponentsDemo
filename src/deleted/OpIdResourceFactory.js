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