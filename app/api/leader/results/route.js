import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'leader_responses.json');

export async function GET() {
    try {
        let data = [];
        try {
            const fileContent = await fs.readFile(dataFilePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            data = [];
        }

        // Keyword Analysis
        const allText = data.map(d => d.feedback).join(' ');
        // Split by whitespace and special characters, keep consistent
        const words = allText.split(/[^a-zA-Z0-9가-힣]+/).filter(w => w.length >= 2);

        const frequency = {};
        let totalKeywords = 0;

        words.forEach(word => {
            if (!frequency[word]) {
                frequency[word] = 0;
            }
            frequency[word]++;
            totalKeywords++;
        });

        // Convert to array and sort
        const keywords = Object.keys(frequency)
            .map(word => ({
                word,
                count: frequency[word],
                ratio: totalKeywords > 0 ? ((frequency[word] / totalKeywords) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20 keywords

        return NextResponse.json({
            responses: data,
            analytics: {
                totalCount: data.length,
                keywords
            }
        });
    } catch (error) {
        console.error('Error fetching leader results:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch results' }, { status: 500 });
    }
}
