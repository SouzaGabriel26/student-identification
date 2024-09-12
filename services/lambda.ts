type GetPresignedUrlResponse = {
  presigned_url: string;
  file_url: string;
};

async function getPresignedUrl(file: File) {
  const url = process.env.LAMBDA_FUNCTION_URL!;

  const data = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
    }),
  });

  return data.json() as Promise<GetPresignedUrlResponse>;
}

async function uploadFileTOS3(file: File, presignedUrl: string) {
  const data = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  return data;
}

async function uploadFile(file: File) {
  const { file_url, presigned_url } = await getPresignedUrl(file);
  await uploadFileTOS3(file, presigned_url);
  return {
    file_url,
  };
}

export const lambda = Object.freeze({
  uploadFile,
});

export type LambdaService = typeof lambda;
