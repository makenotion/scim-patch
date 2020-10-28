import { ScimError, InvalidScimPatch, InvalidScimPatchOp, NoPathInScimPatchOp, InvalidScimPatchRequest } from './errors/scimErrors';
import { ScimPatchSchema, ScimId, ScimSchema, ScimPatchOperation, ScimPatchRemoveOperation, ScimPatchAddReplaceOperation, ScimPatch, ScimResource, ScimMeta } from './types/types';
export { ScimPatchSchema, ScimId, ScimSchema, ScimPatchOperation, ScimPatchRemoveOperation, ScimPatchAddReplaceOperation, ScimPatch, ScimResource, ScimMeta, ScimError, InvalidScimPatch, InvalidScimPatchOp, NoPathInScimPatchOp, InvalidScimPatchRequest };
export declare const PATCH_OPERATION_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
export declare function patchBodyValidation(body: ScimPatch): void;
export declare function scimPatch(scimResource: ScimResource, patchOperations: Array<ScimPatchOperation>): ScimResource;
