class MonsterApiClient {
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

  async uploadFile(model: string, file: File): Promise<Record<string, any>> {
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
      const presignedUrlResponse = await this.fetch(url, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
      });

      if (!presignedUrlResponse.ok) {
          throw new Error(`Failed to get presigned URL: ${presignedUrlResponse.statusText}`);
      }

      const result = await presignedUrlResponse.json();

      try {
          const binaryData = await file.arrayBuffer();
          const uploadResponse = await this.fetch(result.url, {
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
          const fileUrlResponse = await this.fetch(fileUrl, {
              method: 'POST',
              body: JSON.stringify(s3Data),
              headers: { 'Content-Type': 'application/json' },
          });

          if (!fileUrlResponse.ok) {
              throw new Error(`Failed to get file URL: ${fileUrlResponse.statusText}`);
          }

          return fileUrlResponse.json();
      } catch (uploadError) {
          throw uploadError;
      }
  }
}

export default MonsterApiClient;
