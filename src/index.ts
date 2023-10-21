import axios from 'axios';
export class MonsterApiClient {
    constructor(private apiKey: string) {
        this.apiUrl = 'https://api.monsterapi.ai/v1';
    }

    private apiUrl: string;


    // Check if the code is running in a Node.js environment
    private isNodeEnvironment() {
        return typeof window === 'undefined';
    }

    // Conditional import based on the environment
    private async fetch(url: string, options: RequestInit): Promise<Response> {
        if (this.isNodeEnvironment()) {
            const fetch = require('node-fetch');
            return fetch(url, options);
        } else {
            return window.fetch(url, options);
        }
    }

    // Generate a UUID compatible with the environment
    private generateUuid(): string {
        if (this.isNodeEnvironment()) {
            const { v4: uuidv4 } = require('uuid');
            return uuidv4();
        } else {
            // Use a browser-compatible UUID generator (e.g., uuid-browser)
            const uuid = require('uuid');
            return uuid.v4();
        }
    }

    private fs: any; // 'fs' module
    private path: any; // 'path' module

    private initNodeModules() {
        if (this.isNodeEnvironment()) {
            this.fs = require('fs');
            this.path = require('path');
        }
    }

    async get_response(model: string, data: Record<string, any>): Promise<Record<string, any>> {
        const url = `${this.apiUrl}/generate/${model}`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
        };

        try {
            const response = await this.fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Error fetching response: Request failed with status code ${response.status}`);
            }

            const responseData: any = await response.json();
            return responseData;
        } catch (error: any) {
            throw new Error(`Error generating content: ${error.message}`);
        }
    }

    async get_status(processId: string): Promise<Record<string, any>> {
        const url = `${this.apiUrl}/status/${processId}`;
        const headers: HeadersInit = {
            Authorization: `Bearer ${this.apiKey}`,
        };

        try {
            const response = await this.fetch(url, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Error fetching status: Request failed with status code ${response.status}`);
            }

            const statusData: any = await response.json();
            return statusData;
        } catch (error: any) {
            throw new Error(`Error getting status: ${error.message}`);
        }
    }

    async wait_and_get_result(processId: string, timeout = 60): Promise<Record<string, any>> {
        const startTime = Date.now();
        while (true) {
            const statusResponse = await this.get_status(processId);
            if (statusResponse.status === 'COMPLETED') {
                return statusResponse.result;
            } else if (statusResponse.status === 'FAILED') {
                throw new Error(`Process ${processId} failed: ${statusResponse.result.errorMessage}`);
            } else if (Date.now() - startTime >= timeout * 1000) {
                throw new Error(`Timeout waiting for process ${processId} to complete`);
            }

            // Delay for a short time before checking the status again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async generate(model: string, data: Record<string, any>): Promise<Record<string, any>> {
        try {
            // Step 1: Generate a process ID
            const response = await this.get_response(model, data);
            const processId = response.process_id;

            // Step 2: Wait for the process to complete and get the result
            const result = await this.wait_and_get_result(processId);

            return result;
        } catch (error: any) {
            throw new Error(`Error generating content: ${error.message}`);
        }
    }
    async uploadFile(filePath: string): Promise<string> {
        const url = 'https://api.monsterapi.ai/v1/upload';
    
        const headers = {
            accept: 'application/json',
            authorization: `Bearer ${this.apiKey}`,
        };
    
        try {
            this.initNodeModules(); // Initialize 'fs' and 'path' for Node.js
    
            let filename;
    
            if (this.isNodeEnvironment() && this.fs && this.path) {
                filename = this.path.basename(filePath);
            } else {
                throw new Error('File upload is only supported in a Node.js environment.');
            }
    
            // Prepare the payload including the 'filename'
            const payload = {
                filename,
            };
    
            // Send a GET request to get the upload URL and download URL
            const get_file_urls = await axios.get(url, { headers, params: payload });
    
            // Extract the upload URL and download URL from the response
            const { upload_url, download_url } = get_file_urls.data;
    
            // Read file content as binary data
            const data = await this.readFileAsBuffer(filePath);
    
            // Create headers for the upload
            const uploadHeaders = {
                'Content-Type': 'application/octet-stream', // Content type for binary data
            };
    
            // Upload the file using axios in Node.js
            const uploadResponse = await axios.put(upload_url, data, {
                headers: uploadHeaders,
            });
    
            // Check if the file was successfully uploaded
            if (uploadResponse.status === 200) {
                return download_url;
            } else {
                throw new Error('Failed to upload file');
            }
        } catch (error: any) {
            throw new Error(`Error uploading file: ${error.message}`);
        }
    }


    private async readFileAsBuffer(filePath: string): Promise<Buffer> {
        if (this.isNodeEnvironment() && this.fs) {
            return new Promise<Buffer>((resolve, reject) => {
                this.fs.readFile(filePath, (err: any, data: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        } else {
            throw new Error('Cannot read file as a buffer in a browser environment');
        }
    }

    private readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                if (event.target && event.target.result) {
                    resolve(event.target.result as ArrayBuffer);
                } else {
                    reject(new Error('Failed to read file as ArrayBuffer'));
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            const file = new Blob([filePath], { type: 'application/octet-stream' });
            reader.readAsArrayBuffer(file);
        });
    }


}

