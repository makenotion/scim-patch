export declare type ScimPatchSchema = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
export declare type ScimId = string;
export declare type ScimSchema = string;
export declare type ScimPatchOperation = ScimPatchRemoveOperation | ScimPatchAddReplaceOperation;
export interface ScimResource {
    id?: ScimId;
    readonly meta: ScimMeta;
    schemas: Array<ScimSchema>;
}
export interface ScimPatchRemoveOperation {
    readonly op: 'remove' | 'Remove';
    readonly path: string;
}
export interface ScimPatchAddReplaceOperation {
    readonly op: 'add' | 'Add' | 'replace' | 'Replace';
    readonly path?: string;
    readonly value?: any;
}
export interface ScimPatch {
    readonly schemas: Array<ScimPatchSchema>;
    readonly Operations: Array<ScimPatchOperation>;
}
export interface ScimMeta {
    readonly created: Date;
    readonly lastModified: Date;
    readonly location?: string;
}
