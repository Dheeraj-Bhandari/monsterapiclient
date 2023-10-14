"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class MonsterApiClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.monsterapi.ai/v1';
    }
    // Check if the code is running in a Node.js environment
    isNodeEnvironment() {
        return typeof window === 'undefined';
    }
    // Conditional import based on the environment
    fetch(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isNodeEnvironment()) {
                const fetch = require('node-fetch');
                return fetch(url, options);
            }
            else {
                return window.fetch(url, options);
            }
        });
    }
    // Generate a UUID compatible with the environment
    generateUuid() {
        if (this.isNodeEnvironment()) {
            const { v4: uuidv4 } = require('uuid');
            return uuidv4();
        }
        else {
            // Use a browser-compatible UUID generator (e.g., uuid-browser)
            const uuid = require('uuid');
            return uuid.v4();
        }
    }
    get_response(model, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.apiUrl}/generate/${model}`;
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            };
            try {
                const response = yield this.fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data),
                });
                if (!response.ok) {
                    throw new Error(`Error fetching response: Request failed with status code ${response.status}`);
                }
                const responseData = yield response.json();
                return responseData;
            }
            catch (error) {
                throw new Error(`Error generating content: ${error.message}`);
            }
        });
    }
    get_status(processId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.apiUrl}/status/${processId}`;
            const headers = {
                Authorization: `Bearer ${this.apiKey}`,
            };
            try {
                const response = yield this.fetch(url, {
                    method: 'GET',
                    headers,
                });
                if (!response.ok) {
                    throw new Error(`Error fetching status: Request failed with status code ${response.status}`);
                }
                const statusData = yield response.json();
                return statusData;
            }
            catch (error) {
                throw new Error(`Error getting status: ${error.message}`);
            }
        });
    }
    wait_and_get_result(processId, timeout = 60) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            while (true) {
                const statusResponse = yield this.get_status(processId);
                if (statusResponse.status === 'COMPLETED') {
                    return statusResponse.result;
                }
                else if (statusResponse.status === 'FAILED') {
                    throw new Error(`Process ${processId} failed: ${statusResponse.result.errorMessage}`);
                }
                else if (Date.now() - startTime >= timeout * 1000) {
                    throw new Error(`Timeout waiting for process ${processId} to complete`);
                }
                // Delay for a short time before checking the status again
                yield new Promise(resolve => setTimeout(resolve, 1000));
            }
        });
    }
    generate(model, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Step 1: Generate a process ID
                const response = yield this.get_response(model, data);
                const processId = response.process_id;
                // Step 2: Wait for the process to complete and get the result
                const result = yield this.wait_and_get_result(processId);
                return result;
            }
            catch (error) {
                throw new Error(`Error generating content: ${error.message}`);
            }
        });
    }
    uploadFile(model, file) {
        return __awaiter(this, void 0, void 0, function* () {
            const filename = file.name;
            const filetype = file.type;
            // Check if the file size is within the limit (8MB)
            if (file.size > 8 * 1024 * 1024) {
                throw new Error('File size exceeds the allowed limit (8MB)');
            }
            const generatedUuid = this.generateUuid();
            const data = {
                model,
                filename,
                filetype,
                uuid: generatedUuid,
            };
            const url = 'https://alpha4.monsterapi.ai/backend/v2playground/get-presigned-url-playgroundv2';
            const presignedUrlResponse = yield this.fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!presignedUrlResponse.ok) {
                throw new Error(`Failed to get presigned URL: ${presignedUrlResponse.statusText}`);
            }
            const result = yield presignedUrlResponse.json();
            try {
                const binaryData = yield file.arrayBuffer();
                const uploadResponse = yield this.fetch(result.url, {
                    method: 'PUT',
                    body: binaryData,
                    headers: { 'Content-Type': 'application/octet-stream' },
                });
                if (!uploadResponse.ok) {
                    throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
                }
                const s3Url = `s3://qbfinetuningapigateway-s3uploadbucket-rkiyd0cpm7i0/${model}/${generatedUuid}_${filename}`;
                const s3Data = {
                    s3Url,
                };
                const fileUrl = 'https://alpha4.monsterapi.ai/backend/v2playground/get-file-url-playgroundv2';
                const fileUrlResponse = yield this.fetch(fileUrl, {
                    method: 'POST',
                    body: JSON.stringify(s3Data),
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!fileUrlResponse.ok) {
                    throw new Error(`Failed to get file URL: ${fileUrlResponse.statusText}`);
                }
                return fileUrlResponse.json();
            }
            catch (uploadError) {
                throw uploadError;
            }
        });
    }
}
exports.default = MonsterApiClient;
