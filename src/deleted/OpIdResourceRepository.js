class OpIdResourceRepositoryClass {
    getOpIdResource_createByIdentityUrl(identityUrl) {
        return opIdResourceFactory.createByIdentityUrl(identityUrl);
    }

    getOpIdResource_createByIdentityName(identityName) {
        return opIdResourceFactory.createByIdentityName(identityName);
    }
}