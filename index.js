class MonsterApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.monsterapi.ai/v1'; // Replace with the actual API URL
  }

  async generate(model, data) {
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

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      throw new Error(`Error generating content: ${error.message}`);
    }
  }

  async getStatus(processId) {
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

      const statusData = await response.json();
      return statusData;
    } catch (error) {
      throw new Error(`Error getting status: ${error.message}`);
    }
  }

  async waitAndGetResult(processId, timeout = 60) {
    const startTime = Date.now();
    while (true) {
      const statusResponse = await this.getStatus(processId);
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
}

module.exports = MonsterApiClient;
