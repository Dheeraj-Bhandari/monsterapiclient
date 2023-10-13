import fetch from 'node-fetch';
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
class MonsterApiClient {
  constructor(private apiKey: string) {
    this.apiUrl = 'https://api.monsterapi.ai/v1'; // Replace with the actual API URL
  }

  private apiUrl: string;

  // Generate Process Id
  async get_response(model: string, data: Record<string, any>): Promise<Record<string, any>> {
    const url = `${this.apiUrl}/generate/${model}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error fetching response: Request failed with status code ${response.status}`);
      }

      const responseData: any = await response.json();
      return responseData;
    } catch (error: any) { // Specify the error type as Error
      throw new Error(`Error generating content: ${error.message}`);
    }
  }

  // Get Process Id Status
  async get_status(processId: string): Promise<Record<string, any>> {
    const url = `${this.apiUrl}/status/${processId}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error fetching status: Request failed with status code ${response.status}`);
      }

      const statusData: any = await response.json();
      return statusData;
    } catch (error: any) { // Specify the error type as Error
      throw new Error(`Error getting status: ${error.message}`);
    }
  }

  // get result from Process Id
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

  // Generate Process Id and Get Result
  async generate(model: string, data: Record<string, any>): Promise<Record<string, any>> {
    try {
      // Step 1: Generate a process ID
      const response = await this.get_response(model, data);
      const processId = response.processId;

      // Step 2: Wait for the process to complete and get the result
      const result = await this.wait_and_get_result(processId);

      return result;
    } catch (error: any) {
      throw new Error(`Error generating content: ${error.message}`);
    }
  }

  // Upload File
  async uploadFile(model: string, file: Record<string, any>): Promise<Record<string, any>> {

    const filename = file.name;
    const filetype = file.type;

    // Check if the file size is within the limit (8MB)
    if (file.size > 8 * 1024 * 1024) {
      return Promise.reject(new Error('File size exceeds the allowed limit (8MB)'));
    }

    return new Promise(async (resolve, reject) => {
      try {
        const generatedUuid = uuidv4();
        const data = {
          model,
          filename,
          filetype,
          uuid: generatedUuid,
        };

        const url = 'https://alpha4.monsterapi.ai/backend/v2playground/get-presigned-url-playgroundv2';
        const presignedUrlResponse = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!presignedUrlResponse.ok) {
          reject(new Error(`Failed to get presigned URL: ${presignedUrlResponse.statusText}`));
          return;
        }

        const result = await presignedUrlResponse.json();

        try {
          const binaryData = await fs.readFile(file);
          const url = result.url;

          const uploadResponse = await fetch(url, {
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
          const fileUrlResponse = await fetch(fileUrl, {
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
        } catch (uploadError) {
          reject(uploadError);
        }
      } catch (error) {
        console.error('Error uploading file', error);
        reject(error);
      }
    });
  };

}

export default MonsterApiClient;
