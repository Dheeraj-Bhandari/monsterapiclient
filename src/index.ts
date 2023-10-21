
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

    async uploadFile(filePath: string | File): Promise<string> {
        this.initNodeModules();

        const getUploadUrlUrl = 'https://api.monsterapi.ai/v1/upload';
        const headers = {
            accept: 'application/json',
            authorization: `Bearer ${this.apiKey}`,
        };

        try {
            let filename: string;
            let data: Buffer | ArrayBuffer;

            if (this.isNodeEnvironment()) {
                if (typeof filePath === 'string') {
                    filename = filePath.split('/').pop() || ''; // Get the filename from the path
                    data = this.fs.readFileSync(filePath); // Read file as Buffer for Node.js
                } else {
                    throw new Error('Invalid file path provided.');
                }
            } else {
                if (filePath instanceof File) {
                    filename = filePath.name;
                    data = await this.readFileAsArrayBuffer(filePath); // Read file as ArrayBuffer for the browser
                } else {
                    throw new Error('Invalid File object provided.');
                }
            }

            // Prepare the payload including the 'filename'
            const payload = {
                filename,
            };

            // Use the Fetch API to perform the GET request to obtain upload_url and download_url
            const getUrlsResponse = await fetch(`${getUploadUrlUrl}?filename=${filename}`, {
                method: 'GET',
                headers,
            });

            if (!getUrlsResponse.ok) {
                throw new Error(`Failed to obtain upload and download URLs: ${getUrlsResponse.status}`);
            }

            const { upload_url, download_url } = await getUrlsResponse.json();

            // Create a Blob from the file data
            const blob = new Blob([data], { type: 'application/octet-stream' });

            // Use the Fetch API to perform the upload
            const response = await fetch(upload_url, {
                method: 'PUT',
                body: blob,
            });

            if (response.ok) {
                return download_url;
            } else {
                throw new Error('Failed to upload file');
            }
        } catch (error: any) {
            throw Error(`Error uploading file: ${error.message}`);
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

    private readFileAsArrayBuffer(filePath: string | File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            if (typeof filePath === 'string') {
                if (this.isNodeEnvironment() && this.fs) {
                    // Read the file as a Buffer in Node.js
                    this.fs.readFile(filePath, (err: any, data: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data.buffer);
                        }
                    });
                } else {
                    reject(new Error('Cannot read file as a buffer in a browser environment'));
                }
            } else if (filePath instanceof File) {
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

                reader.readAsArrayBuffer(filePath);
            } else {
                reject(new Error('Invalid file path or File object provided.'));
            }
        });
    }

}

