export interface IStoryCreate {
    userId: string;
    mediaUrl: string;
    caption?: string;
    taggedUsers?: string[];
}
