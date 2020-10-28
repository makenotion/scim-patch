"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scimPatch = exports.patchBodyValidation = exports.PATCH_OPERATION_SCHEMA = exports.InvalidScimPatchRequest = exports.NoPathInScimPatchOp = exports.InvalidScimPatchOp = exports.InvalidScimPatch = exports.ScimError = void 0;
const scimErrors_1 = require("./errors/scimErrors");
Object.defineProperty(exports, "ScimError", { enumerable: true, get: function () { return scimErrors_1.ScimError; } });
Object.defineProperty(exports, "InvalidScimPatch", { enumerable: true, get: function () { return scimErrors_1.InvalidScimPatch; } });
Object.defineProperty(exports, "InvalidScimPatchOp", { enumerable: true, get: function () { return scimErrors_1.InvalidScimPatchOp; } });
Object.defineProperty(exports, "NoPathInScimPatchOp", { enumerable: true, get: function () { return scimErrors_1.NoPathInScimPatchOp; } });
Object.defineProperty(exports, "InvalidScimPatchRequest", { enumerable: true, get: function () { return scimErrors_1.InvalidScimPatchRequest; } });
const scim2_parse_filter_1 = require("scim2-parse-filter");
/*
 * This file implement the SCIM PATCH specification.
 * RFC : https://tools.ietf.org/html/rfc7644#section-3.5.2
 * It allow to apply some patch on an existing SCIM resource.
 */
// Regex to check if this is search into array request.
const IS_ARRAY_SEARCH = /(\[|\])/;
// Regex to extract key and search request (ex: emails[primary eq true).
const ARRAY_SEARCH = /^(.+)\[(.+)\]$/;
// Split path on all periods except e.g. "2.0"
const SPLIT_PERIOD = /(?!\d)\.(?!\d)/g;
// Valid patch operation, value needs to be in lowercase here.
const AUTHORIZED_OPERATION = ['remove', 'add', 'replace'];
exports.PATCH_OPERATION_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
/*
 * PatchBodyValidation validate if the request body of the SCIM Patch is valid.
 * If the body is not valid the function throw an error.
 * @Param body data from the patch request.
 * @throws {InvalidScimPatchRequest} if one operation is not valid.
 * @throws {NoPathInScimPatchOp} if one operation is a remove with no path.
 */
function patchBodyValidation(body) {
    if (!body.schemas || !body.schemas.includes(exports.PATCH_OPERATION_SCHEMA))
        throw new scimErrors_1.InvalidScimPatchRequest('Missing schemas.');
    if (!body.Operations || body.Operations.length <= 0)
        throw new scimErrors_1.InvalidScimPatchRequest('Missing operations.');
    body.Operations.forEach(validatePatchOperation);
}
exports.patchBodyValidation = patchBodyValidation;
/*
 * This method apply patch operations on a SCIM Resource.
 * @param scimResource The initial resource
 * @param patchOperations An array of SCIM patch operations we want to apply on the scimResource object.
 * @return the scimResource patched.
 * @throws {InvalidScimPatchOp} if the patch could not happen.
 */
function scimPatch(scimResource, patchOperations) {
    return patchOperations.reduce((patchedResource, patch) => {
        switch (patch.op) {
            case 'remove':
            case 'Remove':
                return applyRemoveOperation(patchedResource, patch);
            case 'add':
            case 'Add':
            case 'replace':
            case 'Replace':
                return applyAddOrReplaceOperation(patchedResource, patch);
            default:
                throw new scimErrors_1.InvalidScimPatchRequest(`Operator is invalid for SCIM patch request. ${patch}`);
        }
    }, scimResource);
}
exports.scimPatch = scimPatch;
/*
 * validateOperation is validating that the SCIM Patch Operation follow the RFC.
 * If not, the function throw an Error.
 * @Param operation The SCIM operation we want to check.
 * @throws {InvalidScimPatchRequest} if the operation is not valid.
 * @throws {NoPathInScimPatchOp} if the operation is a remove with no path.
 */
function validatePatchOperation(operation) {
    if (!operation.op || Array.isArray(operation.op) || !isValidOperation(operation.op))
        throw new scimErrors_1.InvalidScimPatchRequest(`Invalid op "${operation.op}" in the request.`);
    if (operation.op === 'remove' && !operation.path)
        throw new scimErrors_1.NoPathInScimPatchOp();
    if (operation.op === 'add' && !('value' in operation))
        throw new scimErrors_1.InvalidScimPatchRequest(`The operation ${operation.op} MUST contain a "value" member whose content specifies the value to be added`);
    if (operation.path && typeof operation.path !== 'string')
        throw new scimErrors_1.InvalidScimPatchRequest('Path is supposed to be a string');
}
function applyRemoveOperation(scimResource, patch) {
    // We manipulate the object directly without knowing his property, that's why we use any.
    let resource = scimResource;
    validatePatchOperation(patch);
    // Path is supposed to be set, there are a validation in the validateOperation function.
    const paths = patch.path.split(SPLIT_PERIOD);
    resource = navigate(resource, paths);
    // Dealing with the last element of the path.
    const lastSubPath = paths[paths.length - 1];
    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        // This is a mono valued property, we delete it.
        delete resource[lastSubPath];
        return scimResource;
    }
    // The last element is an Array request.
    const { attrName, valuePath, array } = extractArray(lastSubPath, resource);
    // We keep only items who don't match the query.
    resource[attrName] = array.filter((e) => !filterWithQuery(array, valuePath).includes(e));
    // If the complex multi-valued attribute has no remaining records, the attribute SHALL be considered unassigned.
    if (resource[attrName].length === 0)
        delete resource[attrName];
    return scimResource;
}
function applyAddOrReplaceOperation(scimResource, patch) {
    // We manipulate the object directly without knowing his property, that's why we use any.
    let resource = scimResource;
    validatePatchOperation(patch);
    if (!patch.path)
        return addOrReplaceAttribute(scimResource, patch);
    // We navigate till the second to last of the path.
    const paths = patch.path.split(SPLIT_PERIOD);
    resource = navigate(resource, paths);
    const lastSubPath = paths[paths.length - 1];
    if (!IS_ARRAY_SEARCH.test(lastSubPath)) {
        resource[lastSubPath] = addOrReplaceAttribute(resource[lastSubPath], patch);
        return scimResource;
    }
    // The last element is an Array request.
    const { valuePath, array } = extractArray(lastSubPath, resource);
    // Get the list of items who are successful for the search query.
    const matchFilter = filterWithQuery(array, valuePath);
    // If the target location specifies a complex attribute, a set of sub-attributes SHALL be specified in the "value"
    // parameter, which replaces any existing values or adds where an attribute did not previously exist.
    const isReplace = patch.op.toLowerCase() === 'replace';
    if (isReplace && matchFilter.length === 0) {
        array.push(patch.value);
        return scimResource;
    }
    // We are sure to find an index because matchFilter comes from array.
    const index = array.findIndex(item => matchFilter.includes(item));
    array[index] = addOrReplaceAttribute(array[index], patch);
    return scimResource;
}
/**
 * extractArray extract the valuePath (ex: email[primary eq true]) of a subPath
 * @param subPath The key we want to extract.
 * @param schema The object which is supposed to contains the array.
 * @return an array with the array name and the filter path.
 */
function extractArray(subPath, schema) {
    // We extract the key of the table and what is inside [].
    const matchRequest = subPath.match(ARRAY_SEARCH);
    if (!matchRequest)
        throw new scimErrors_1.InvalidScimPatchOp(`This part of the path ${subPath} is invalid for SCIM patch request.`);
    const [, attrName, valuePath] = matchRequest;
    const element = schema[attrName];
    if (!Array.isArray(element))
        throw new scimErrors_1.InvalidScimPatchOp('Impossible to search on a mono valued attribute.');
    return new ScimSearchQuery(attrName, valuePath, element);
}
/**
 * navigate allow to get the sub object who want to edit with the patch operation.
 * @param inputSchema the initial ScimResource
 * @param paths an Array who contains the path of the sub object
 * @return the parent object of the element we want to edit
 */
function navigate(inputSchema, paths) {
    let schema = inputSchema;
    for (let i = 0; i < paths.length - 1; i++) {
        const subPath = paths[i];
        // We check if the element is an array with query (ex: emails[primary eq true).
        if (IS_ARRAY_SEARCH.test(subPath)) {
            const { valuePath, array } = extractArray(subPath, schema);
            try {
                // Get the item who is successful for the search query.
                const matchFilter = filterWithQuery(array, valuePath);
                // We are sure to find an index because matchFilter comes from array.
                const index = array.findIndex(item => matchFilter.includes(item));
                schema = array[index];
            }
            catch (error) {
                throw new scimErrors_1.InvalidScimPatchOp(error);
            }
        }
        else {
            // The element is not an array.
            if (!schema[subPath])
                schema[subPath] = {};
            schema = schema[subPath];
        }
    }
    return schema;
}
/**
 * Add or Replace a property in the ScimResource
 * @param property The property we want to replace
 * @param patch The patch operation
 * @return the patched property
 */
function addOrReplaceAttribute(property, patch) {
    if (Array.isArray(property)) {
        const op = patch.op.toLowerCase();
        const isReplace = op === "replace";
        const isAdd = op === "add";
        if ((isReplace || isAdd) && Array.isArray(patch.value))
            return patch.value;
        const a = property;
        if (!a.includes(patch.value))
            a.push(patch.value);
        return a;
    }
    if (typeof property === 'object') {
        if (typeof patch.value !== 'object') {
            if (patch.op === 'add')
                throw new scimErrors_1.InvalidScimPatchOp('Invalid patch query.');
            return patch.value;
        }
        return Object.assign(Object.assign({}, property), patch.value);
    }
    // If the target location specifies a single-valued attribute, the existing value is replaced.
    return patch.value;
}
/**
 * Return the items in the array who match the filter.
 * @param arr the collection where we are searching.
 * @param querySearch the search request.
 * @return an array who contains the search results.
 */
function filterWithQuery(arr, querySearch) {
    try {
        return arr.filter(scim2_parse_filter_1.filter(scim2_parse_filter_1.parse(querySearch)));
    }
    catch (error) {
        throw new scimErrors_1.InvalidScimPatchOp(error);
    }
}
function isValidOperation(operation) {
    return AUTHORIZED_OPERATION.includes(operation.toLowerCase());
}
class ScimSearchQuery {
    constructor(attrName, valuePath, array) {
        this.attrName = attrName;
        this.valuePath = valuePath;
        this.array = array;
    }
}
//# sourceMappingURL=scimPatch.js.map