"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scimPatch_1 = require("../src/scimPatch");
const chai_1 = require("chai");
const scimErrors_1 = require("../src/errors/scimErrors");
describe('PATCH Validation', () => {
    it('Missing Schemas', done => {
        const patch = {
            Operations: [{
                    op: 'replace', value: false, path: 'active'
                }]
        };
        chai_1.expect(() => scimPatch_1.patchBodyValidation(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Missing Operations', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp']
        };
        chai_1.expect(() => scimPatch_1.patchBodyValidation(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Invalid operation', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'toto', value: false, path: 'active'
                }]
        };
        chai_1.expect(() => scimPatch_1.patchBodyValidation(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Operation remove without path', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'remove'
                }]
        };
        chai_1.expect(() => scimPatch_1.patchBodyValidation(patch)).to.throw(scimPatch_1.NoPathInScimPatchOp);
        return done();
    });
    it('Operation add without value', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'add', path: 'active'
                }]
        };
        chai_1.expect(() => scimPatch_1.patchBodyValidation(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
    it('Path is not a string', done => {
        const patch = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{
                    op: 'add', path: true, value: 'toto'
                }]
        };
        chai_1.expect(() => scimPatch_1.patchBodyValidation(patch)).to.throw(scimErrors_1.InvalidScimPatchRequest);
        return done();
    });
});
//# sourceMappingURL=patchValidation.test.js.map