const { v4: uuidv4 } = require('uuid');
import fetch from 'node-fetch';
const fs = require('fs').promises;

const handleFileUpload = async (model: string, filename: string, filetype: string, filePath: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const generatedUuid = uuidv4();
      const data = {
        model,
        filename,
        filetype,
        uuid: generatedUuid,
      };

      const url = 'https://monsterapi.ai/backend/v2playground/get-presigned-url-playgroundv2';
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
        const binaryData = await fs.readFile(filePath);
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

        const fileUrl = 'https://monsterapi.ai/backend/v2playground/get-file-url-playgroundv2';
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

// handleFileUpload("sdxl-base", "img.png", "image", './img.png').then((result) => {
//   console.log(result);
// }).catch((err) => {
//   console.log(err);
// });
