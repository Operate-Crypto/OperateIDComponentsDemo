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