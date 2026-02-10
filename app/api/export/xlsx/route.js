import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';

const dataFilePath = path.join(process.cwd(), 'data', 'responses.json');

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const department = searchParams.get('department') || 'all';
        const rank = searchParams.get('rank') || 'all';

        let data = [];
        try {
            const fileContent = await fs.readFile(dataFilePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            data = [];
        }

        // Apply filters
        const filteredData = data.filter(item => {
            if (department !== 'all' && item.department !== department) return false;
            if (rank !== 'all' && item.rank !== rank) return false;
            return true;
        });

        const headers = ['소속', '직급', '면담여부', 'Q2시간', 'Q3방식', 'Q4안내', 'Q6만족도', 'Q7-1', 'Q7-2', 'Q7-3', 'Q7-4', 'Q7-5', 'Q8건의', 'Q5미실시사유', 'Q3미실시건의'];

        const rows = filteredData.map(d => [
            d.department,
            d.rank,
            d.q1_hasInterview === 'yes' ? '실시' : '미실시',
            d.q2_time || '-',
            d.q3_method === 'other' ? d.q3_method_other : d.q3_method || '-',
            d.q4_guidance || '-',
            d.q6_satisfaction || '-',
            ...(d.q7_scores?.items || ['-', '-', '-', '-', '-']),
            d.q8_suggestions || '',
            d.q1_hasInterview === 'no' ? (d.q5_reason || []).join('|') : '-',
            d.q3_no_suggestions || ''
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Results');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="survey_results_${new Date().toISOString().split('T')[0]}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (error) {
        console.error('Error exporting results:', error);
        return NextResponse.json({ success: false, error: 'Failed to export results' }, { status: 500 });
    }
}
