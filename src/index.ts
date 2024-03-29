export default class MonsterApiClient {
    private apiKey: string;
    private apiUrl: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.monsterapi.ai/v1';
    }

    private async fetch(url: string, options: RequestInit): Promise<Response> {
        if (typeof window === 'undefined' || typeof window.document === 'undefined') {
            const nodeFetch = require('node-fetch');
            return nodeFetch(url, options);
        } else {
            return window.fetch(url, options);
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

    async wait_and_get_result(processId: string, timeout: number = 60): Promise<Record<string, any>> {
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

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async generate(model: string, data: Record<string, any>): Promise<Record<string, any>> {
        try {
            const response = await this.get_response(model, data);
            const processId = response.process_id;
            const result = await this.wait_and_get_result(processId);
            return result;
        } catch (error: any) {
            throw new Error(`Error generating content: ${error.message}`);
        }
    }

    async uploadFile(fileInput: File): Promise<string | any> {
        const getUploadUrlUrl = 'https://api.monsterapi.ai/v1/upload';
        const headers: HeadersInit = {
            accept: 'application/json',
            authorization: `Bearer ${this.apiKey}`,
        };

        try {
            const response = await this.fetch(`${getUploadUrlUrl}?filename=${fileInput.name}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to obtain upload and download URLs: ${response.status}`);
            }

            const { upload_url, download_url } = await response.json();

            // Read the file as binary data
            let fileArrayBuffer;
            if (typeof fileInput.arrayBuffer === 'function') {
                fileArrayBuffer = await fileInput.arrayBuffer();

            }
            else {
                return {
                    upload_url, download_url, info: `Seems Like you trying to use uploadFile method in Node Js environment. You Can use upload_url Api in this response directly in Nodejs. For More Details Visit https://developer.monsterapi.ai/reference/get_upload`
                }

            }
            // Determine the content type of the uploaded file
            const mimeType = fileInput.type; // Use the file's MIME type if available

            const fileHeaders: HeadersInit = {
                'Content-Type': mimeType,
            };

            // Upload the file data (ArrayBuffer) to the obtained URL
            const uploadResponse = await this.fetch(upload_url, {
                method: 'PUT',
                body: fileArrayBuffer,
                headers: fileHeaders,
            });

            if (uploadResponse.ok) {
                return download_url;
            } else {
                throw new Error('Failed to upload file');
            }
        } catch (error: any) {
            throw new Error(`Error uploading file: ${error.message}`);
        }
    }

    async generateSync(data: Record<string, any>): Promise<Record<string, any>> {
        const url = 'https://llm.monsterapi.ai/v1/generate';
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
            return responseData.response;
        } catch (error: any) {
            throw new Error(`Error generating content with LLM: ${error.message}`);
        }
    }
}
