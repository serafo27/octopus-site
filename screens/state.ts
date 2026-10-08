// Shared by demo.ts (the mocked backend) and scenes.ts: which transcript the next spawned terminal
// prints, and whether its Claude is working.
export const spawnQueue: { transcript: string; busy: boolean }[] = [];
