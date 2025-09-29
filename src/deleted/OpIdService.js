class OpIdServiceClass {
    constructor() {
        this.opIdResourceRepository = new OpIdResourceRepositoryClass();
    }
}

// Create a global service object similar to the original structure
const opId$ = {
    service: new OpIdServiceClass()
};