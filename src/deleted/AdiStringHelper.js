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