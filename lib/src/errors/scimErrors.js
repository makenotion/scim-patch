"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidScimPatchRequest = exports.NoPathInScimPatchOp = exports.InvalidScimPatchOp = exports.InvalidScimPatch = exports.ScimError = void 0;
class ScimError extends Error {
    constructor(scimCode) {
        super();
        this.scimCode = scimCode;
    }
}
exports.ScimError = ScimError;
class InvalidScimPatch extends ScimError {
    constructor(message, scimCode = 'invalidSyntax') {
        super(scimCode);
        this.message = `Invalid SCIM Patch: ${message}`;
    }
}
exports.InvalidScimPatch = InvalidScimPatch;
class InvalidScimPatchOp extends InvalidScimPatch {
    constructor(message) {
        super(`${message}`, 'invalidSyntax');
    }
}
exports.InvalidScimPatchOp = InvalidScimPatchOp;
class NoPathInScimPatchOp extends InvalidScimPatch {
    constructor() {
        super('Missing path in "remove" patch operation', 'noTarget');
    }
}
exports.NoPathInScimPatchOp = NoPathInScimPatchOp;
class InvalidScimPatchRequest extends InvalidScimPatch {
    constructor(message) {
        super(`The SCIM patch request is invalid: ${message}`);
    }
}
exports.InvalidScimPatchRequest = InvalidScimPatchRequest;
//# sourceMappingURL=scimErrors.js.map