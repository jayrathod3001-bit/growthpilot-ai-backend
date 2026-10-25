import express from 'express';
import {
    handleAIChat,
    handleMarketingStrategy,
    handleContentGenerator,
    handleSEOAssistant,
    handleReports,
    handleAnalytics,
    handleNotifications,
    getAIChatHistory,
    getMarketingHistory,
    getContentHistory,
    getSeoHistory
} from '../controllers/aiController.js';
import optionalAuthMiddleware from '../utils/optionalAuthMiddleware.js';

const router = express.Router();

// ─── AI Text Generation (Powered by Local Qwen LLM) ───────────────────────────
router.post('/api/ai/chat', optionalAuthMiddleware, handleAIChat);
router.post('/api/ai/marketing-strategy', optionalAuthMiddleware, handleMarketingStrategy);
router.post('/api/ai/content-generator', optionalAuthMiddleware, handleContentGenerator);
router.post('/api/ai/content', optionalAuthMiddleware, handleContentGenerator);
router.post('/api/ai/seo-assistant', optionalAuthMiddleware, handleSEOAssistant);
router.post('/api/ai/seo-audit', optionalAuthMiddleware, handleSEOAssistant);
router.post('/api/ai/reports', optionalAuthMiddleware, handleReports);
router.post('/api/ai/analytics', optionalAuthMiddleware, handleAnalytics);
router.post('/api/ai/notifications', optionalAuthMiddleware, handleNotifications);

// ─── History Endpoints (MongoDB stored results) ────────────────────────────────
router.get('/api/ai/chat/history', optionalAuthMiddleware, getAIChatHistory);
router.get('/api/ai/marketing-strategy/history', optionalAuthMiddleware, getMarketingHistory);
router.get('/api/ai/content-generator/history', optionalAuthMiddleware, getContentHistory);
router.get('/api/ai/seo-assistant/history', optionalAuthMiddleware, getSeoHistory);

export default router;
