import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'responses.json');

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate body? (Optional for now)

    // Read existing data
    let data = [];
    try {
      const fileContent = await fs.readFile(dataFilePath, 'utf8');
      data = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist or error, start with empty array
      data = [];
    }

    // Add new response with timestamp
    const newResponse = {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      ...body
    };

    data.push(newResponse);

    // Write back to file
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, id: newResponse.id });
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json({ success: false, error: 'Failed to save response' }, { status: 500 });
  }
}
