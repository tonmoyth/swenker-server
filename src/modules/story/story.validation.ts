import { z } from 'zod';

export const createStorySchema = z.object({
    caption: z.string().optional(),
    taggedUsers: z.preprocess((val) => {
        if (typeof val === 'string') {
            return val.split(',').map((v) => v.trim()).filter((v) => v !== '');
        }
        return val;
    }, z.array(z.string())).optional(),
});

export const storyValidation = {
    createStorySchema,
};
