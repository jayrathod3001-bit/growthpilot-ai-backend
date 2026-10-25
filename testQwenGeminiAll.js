import 'dotenv/config';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
    console.log('Testing GrowthPilot AI Backend Endpoints...\n');

    // 1. Root
    try {
        const root = await axios.get(`${BASE_URL}/`);
        console.log('✔ Root Backend:', root.data);
    } catch (e) {
        console.error('✘ Root Backend:', e.message);
    }

    // 2. AI Chat
    try {
        const chat = await axios.post(`${BASE_URL}/api/ai/chat`, {
            userMessage: 'Hello Nexa AI, introduce yourself in 1 sentence.'
        });
        console.log('✔ AI Chat (Qwen):', chat.data?.data?.reply?.slice(0, 100) + '...');
    } catch (e) {
        console.error('✘ AI Chat:', e.response?.data?.message || e.message);
    }

    // 3. Marketing Strategy
    try {
        const ms = await axios.post(`${BASE_URL}/api/ai/marketing-strategy`, {
            marketingGoal: 'Increase sales by 30%',
            budget: '₹25,000',
            product: 'Diamond Jewelry',
            duration: '30 Days'
        });
        console.log('✔ Marketing Strategy (Qwen): Title ->', ms.data?.data?.title, '| Weeks count:', ms.data?.data?.weeks?.length);
    } catch (e) {
        console.error('✘ Marketing Strategy:', e.response?.data?.message || e.message);
    }

    // 4. Content Generator
    try {
        const cg = await axios.post(`${BASE_URL}/api/ai/content-generator`, {
            product: 'Solitaire Ring',
            contentType: 'Instagram Caption',
            tone: 'Luxury'
        });
        console.log('✔ Content Generator (Qwen):', cg.data?.data?.content?.slice(0, 100) + '...');
    } catch (e) {
        console.error('✘ Content Generator:', e.response?.data?.message || e.message);
    }

    // 5. SEO Assistant
    try {
        const seo = await axios.post(`${BASE_URL}/api/ai/seo-assistant`, {
            businessCategory: 'Jewellery',
            targetLocation: 'Ahmedabad'
        });
        console.log('✔ SEO Assistant (Qwen): Score ->', seo.data?.data?.score, '| Meta Title ->', seo.data?.data?.metaTitle);
    } catch (e) {
        console.error('✘ SEO Assistant:', e.response?.data?.message || e.message);
    }

    // 6. Reports
    try {
        const rep = await axios.post(`${BASE_URL}/api/ai/reports`, {
            reportType: 'Business Growth Report'
        });
        console.log('✔ Reports (Qwen): Summary ->', rep.data?.data?.summary?.slice(0, 80) + '...');
    } catch (e) {
        console.error('✘ Reports:', e.response?.data?.message || e.message);
    }

    // 7. Analytics
    try {
        const an = await axios.post(`${BASE_URL}/api/ai/analytics`, {});
        console.log('✔ Analytics (Qwen): Metrics ->', an.data?.data?.analyticsData?.length, 'items | Recs ->', an.data?.data?.recommendations?.length);
    } catch (e) {
        console.error('✘ Analytics:', e.response?.data?.message || e.message);
    }

    // 8. Notifications
    try {
        const notif = await axios.post(`${BASE_URL}/api/ai/notifications`, {});
        console.log('✔ Notifications (Qwen): Count ->', Array.isArray(notif.data?.data) ? notif.data.data.length : 0);
    } catch (e) {
        console.error('✘ Notifications:', e.response?.data?.message || e.message);
    }
}

testEndpoints();
