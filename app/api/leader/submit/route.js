import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'leader_responses.json');

export async function POST(request) {
    try {
        const body = await request.json();

        // Validation
        if (!body.department || !body.feedback) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        let data = [];
        try {
            const fileContent = await fs.readFile(dataFilePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            // File might not exist or be empty
            data = [];
        }

        const newResponse = {
            id: Date.now(),
            submittedAt: new Date().toISOString(),
            department: body.department,
            feedback: body.feedback
        };

        data.push(newResponse);

        // Ensure directory exists
        const dir = path.dirname(dataFilePath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }

        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');

        return NextResponse.json({ success: true, id: newResponse.id });
    } catch (error) {
        console.error('Error saving leader response:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
