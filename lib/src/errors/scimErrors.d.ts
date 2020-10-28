export declare abstract class ScimError extends Error {
    readonly scimCode?: string;
    protected constructor(scimCode?: string);
}
export declare abstract class InvalidScimPatch extends ScimError {
    protected constructor(message: string, scimCode?: string);
}
export declare class InvalidScimPatchOp extends InvalidScimPatch {
    constructor(message: string);
}
export declare class NoPathInScimPatchOp extends InvalidScimPatch {
    constructor();
}
export declare class InvalidScimPatchRequest extends InvalidScimPatch {
    constructor(message: string);
}
