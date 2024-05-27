import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({});
const OPEN_API_KEY = process.env.OPEN_API_KEY;

export interface DataRow {
  year: string;
  employment_type: string;
  job_title: string;
  salary: string;
  employee_residence: string;
  company_location: string;
  company_size: string;
}

const batchSize = 100; // Adjust batch size as needed

export function loadData(filePath: string): Promise<DataRow[]> {
  return new Promise<DataRow[]>((resolve, reject) => {
    const results: DataRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}



export async function convertToEmbeddingsBatch(data: DataRow[]): Promise<number[][]> {
  const embeddingsBatch: number[][] = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batchData = data.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(batchData.map(row => convertToEmbeddings(row.job_title)));
    embeddingsBatch.push(...batchEmbeddings);
    console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)}`);
  }

  return embeddingsBatch;
}

export async function convertToEmbeddings(text: string): Promise<number[]> {
  try {

    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-ada-002',
        input: text
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPEN_API_KEY}`,
        },
      }
    );

    return response.data.data[0].embedding;
  } catch (error:any) {
    console.error('Error converting text to embeddings:', error.response ? error.response.data : error.message);
    throw error;
  }
}


export async function getInsights(data: DataRow[], query: string): Promise<any> {
  const dataEmbeddings = await convertToEmbeddingsBatch(data);
  const queryEmbedding = await convertToEmbeddings(query);

  const similarities = dataEmbeddings.map(embedding => cosineSimilarity(queryEmbedding, embedding));
  const mostSimilarIndex = similarities.indexOf(Math.max(...similarities));

  const mostSimilarRow = data[mostSimilarIndex];
  return {
    mostRelevant: mostSimilarRow,
    query,
    similarity: similarities[mostSimilarIndex]
  };
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
