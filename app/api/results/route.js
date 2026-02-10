import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'responses.json');

const POSITIVE_WORDS = ['좋', '감사', '만족', '도움', '기대', '수월', '명확', '충분', '존중', '성장', '기회', '소통', '유익', '편안', '효율', '체계', '배려', '동기', '열정'];
const NEGATIVE_WORDS = ['힘들', '아쉽', '부족', '불만', '어렵', '불편', '모호', '시간', '부담', '형식', '피곤', '압박', '늦', '적', '복잡', '무리', '갈등', '지연', '비효율'];

// Enhanced Stopwords List (Common Korean functional words, particles, endings)
const STOP_WORDS = [
    '하다', '있다', '없다', '되다', '안되다', '않다', '같다', '싶다', '보다', '주다', '받다', '알다', '모르다',
    '것', '수', '등', '이', '가', '을', '를', '은', '는', '에', '의', '도', '다', '로', '으로', '한', '해', '게', '고', '지',
    '네', '요', '서', '면', '나', '우리', '너', '그', '저', '이것', '저것', '그것', '여기', '저기', '거기',
    '때문', '관련', '대한', '대해', '위해', '통해', '따라', '의해', '가장', '매우', '너무', '많이', '조금', '정말',
    '습니다', '합니다', '있는', '없는', '하는', '되는', '해서', '하고', '하면', '해야', '할', '된', '될', '됨',
    '그리고', '하지만', '그런데', '따라서', '또한', '및', '또', '더', '좀', '자주', '가끔', '보통', '계속', '항상',
    '지금', '이제', '오늘', '내일', '어제', '이번', '저번', '다음', '지난', '경우', '정도', '부분', '점', '측면'
];

function analyzeSentiment(text) {
    if (!text || typeof text !== 'string') return 'neutral';

    let posCount = 0;
    let negCount = 0;

    POSITIVE_WORDS.forEach(word => { if (text.includes(word)) posCount++; });
    NEGATIVE_WORDS.forEach(word => { if (text.includes(word)) negCount++; });

    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
}

function extractKeywords(texts, topN = 10) {
    const frequency = {};
    let totalKeywords = 0;

    texts.forEach(text => {
        if (!text) return;
        // Tokenization: split by non-word characters (focusing on Hangul and Alphanumeric)
        // This simple regex split is a basic approximation for Korean tokenization without a dedicated morphological analyzer.
        const words = text.split(/[^a-zA-Z0-9가-힣]+/).filter(w => w.length >= 2);

        words.forEach(word => {
            // Check against stop words
            if (STOP_WORDS.includes(word)) return;
            if (STOP_WORDS.some(sw => word.endsWith(sw) && word.length > sw.length)) {
                // Very naive stemming check: if word ends with a stop word (like '하는'), skip or trim?
                // For safety in this rule-based approach, we'll just skip exact matches of stop words for now, 
                // as partial matching might remove valid words.
                // Let's stick to exact array inclusion for safety.
            }

            frequency[word] = (frequency[word] || 0) + 1;
            totalKeywords++;
        });
    });

    return Object.keys(frequency)
        .map(word => ({
            word,
            count: frequency[word],
            ratio: totalKeywords > 0 ? ((frequency[word] / totalKeywords) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topN);
}

export async function GET() {
    try {
        let data = [];
        try {
            const fileContent = await fs.readFile(dataFilePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            data = [];
        }

        // Collect all suggestions (Q8 from Yes branch, Q3_no/Q8 from No branch)
        // Note: Field names might vary based on previous edits. 
        // Based on page.js: Yes -> q8_suggestions, No -> q3_no_suggestions

        const suggestions = data.map(d => {
            if (d.q1_hasInterview === 'yes') return d.q8_suggestions;
            if (d.q1_hasInterview === 'no') return d.q3_no_suggestions; // "Q3 미실시 건의" in export
            // Note: In page.js, No branch also has 'q8' (renumbered to 8), but let's stick to the main ones valid for the flow.
            // Actually, looking at page.js:
            // Yes branch: q8_suggestions
            // No branch: q3_no_suggestions (which is labeled "8. 기타 건의사항")
            return null;
        }).filter(Boolean);

        // Classify Sentiment for each suggestion
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        const groupedTexts = { positive: [], neutral: [], negative: [], all: [] };

        suggestions.forEach(text => {
            const sentiment = analyzeSentiment(text);
            sentimentCounts[sentiment]++;
            groupedTexts[sentiment].push(text);
            groupedTexts.all.push(text);
        });

        // Extract Keywords
        const analytics = {
            sentiment: [
                { name: '긍정', value: sentimentCounts.positive, fill: '#00C49F' }, // Green
                { name: '중립', value: sentimentCounts.neutral, fill: '#FFBB28' }, // Yellow
                { name: '부정', value: sentimentCounts.negative, fill: '#FF8042' }  // Orange/Red
            ],
            keywords: {
                overall: extractKeywords(groupedTexts.all),
                positive: extractKeywords(groupedTexts.positive),
                negative: extractKeywords(groupedTexts.negative)
            }
        };

        return NextResponse.json({
            responses: data,
            analytics
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch results' }, { status: 500 });
    }
}
