import fetch from 'node-fetch';

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




}

export default MonsterApiClient;
