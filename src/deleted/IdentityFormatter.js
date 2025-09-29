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