import OpenAI from 'openai';
import type { Bookmark, AIClassificationResponse } from '../types/bookmark.types';

export class AIService {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    public async classifyBookmark(bookmark: Bookmark): Promise<AIClassificationResponse> {
        const prompt = `Analyze this bookmark and suggest appropriate tags and folder:
Title: ${bookmark.title}
URL: ${bookmark.url}

Please classify this bookmark and suggest:
1. A list of relevant tags
2. The most appropriate folder name for this bookmark

Consider the content, purpose, and context of the bookmark.`;

        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a bookmark classification assistant. You analyze URLs and their titles to suggest appropriate tags and folders for organization."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI');
        }

        // Parse AI response - This is a simple implementation
        // You might want to make this more robust
        const lines = content.split('\n');
        const tags = lines
            .find(line => line.toLowerCase().includes('tags:'))
            ?.split(':')[1]
            ?.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0) || [];

        const folder = lines
            .find(line => line.toLowerCase().includes('folder:'))
            ?.split(':')[1]
            ?.trim() || 'Uncategorized';

        return {
            url: bookmark.url,
            suggestedTags: tags,
            suggestedFolder: folder
        };
    }

    public async classifyBookmarks(bookmarks: Bookmark[]): Promise<AIClassificationResponse[]> {
        const results: AIClassificationResponse[] = [];
        for (const bookmark of bookmarks) {
            try {
                const result = await this.classifyBookmark(bookmark);
                results.push(result);
                // Add a small delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`Error classifying bookmark ${bookmark.url}:`, error);
            }
        }
        return results;
    }
} 