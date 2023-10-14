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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
class MonsterApiClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.monsterapi.ai/v1';
    }
    // Generate Process Id
    get_response(model, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.apiUrl}/generate/${model}`;
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            };
            try {
                const response = yield (0, node_fetch_1.default)(url, {
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
            catch (error) { // Specify the error type as Error
                throw new Error(`Error generating content: ${error.message}`);
            }
        });
    }
    // Get Process Id Status
    get_status(processId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.apiUrl}/status/${processId}`;
            const headers = {
                Authorization: `Bearer ${this.apiKey}`,
            };
            try {
                const response = yield (0, node_fetch_1.default)(url, {
                    method: 'GET',
                    headers,
                });
                if (!response.ok) {
                    throw new Error(`Error fetching status: Request failed with status code ${response.status}`);
                }
                const statusData = yield response.json();
                return statusData;
            }
            catch (error) { // Specify the error type as Error
                throw new Error(`Error getting status: ${error.message}`);
            }
        });
    }
    // get result from Process Id
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
    // Generate Process Id and Get Result
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
    // Upload File
    uploadFile(model, file) {
        return __awaiter(this, void 0, void 0, function* () {
            const filename = file.name;
            const filetype = file.type;
            // Check if the file size is within the limit (8MB)
            if (file.size > 8 * 1024 * 1024) {
                return Promise.reject(new Error('File size exceeds the allowed limit (8MB)'));
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const generatedUuid = uuidv4();
                    const data = {
                        model,
                        filename,
                        filetype,
                        uuid: generatedUuid,
                    };
                    const url = 'https://alpha4.monsterapi.ai/backend/v2playground/get-presigned-url-playgroundv2';
                    const presignedUrlResponse = yield (0, node_fetch_1.default)(url, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (!presignedUrlResponse.ok) {
                        reject(new Error(`Failed to get presigned URL: ${presignedUrlResponse.statusText}`));
                        return;
                    }
                    const result = yield presignedUrlResponse.json();
                    try {
                        const binaryData = yield fs.readFile(file);
                        const url = result.url;
                        const uploadResponse = yield (0, node_fetch_1.default)(url, {
                            method: 'PUT',
                            body: binaryData,
                            headers: { 'Content-Type': 'application/octet-stream' },
                        });
                        if (!uploadResponse.ok) {
                            reject(new Error(`Failed to upload file: ${uploadResponse.statusText}`));
                            return;
                        }
                        const s3Url = `s3://qbfinetuningapigateway-s3uploadbucket-rkiyd0cpm7i0/${model}/${generatedUuid}_${filename}`;
                        const s3Data = {
                            s3Url,
                        };
                        const fileUrl = 'https://alpha4.monsterapi.ai/backend/v2playground/get-file-url-playgroundv2';
                        const fileUrlResponse = yield (0, node_fetch_1.default)(fileUrl, {
                            method: 'POST',
                            body: JSON.stringify(s3Data),
                            headers: { 'Content-Type': 'application/json' },
                        });
                        if (!fileUrlResponse.ok) {
                            reject(new Error(`Failed to get file URL: ${fileUrlResponse.statusText}`));
                            return;
                        }
                        console.log('File uploaded successfully');
                        resolve(fileUrlResponse.json());
                    }
                    catch (uploadError) {
                        reject(uploadError);
                    }
                }
                catch (error) {
                    console.error('Error uploading file', error);
                    reject(error);
                }
            }));
        });
    }
    ;
}
exports.default = MonsterApiClient;
