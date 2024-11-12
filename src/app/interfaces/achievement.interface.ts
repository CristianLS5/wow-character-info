export interface Achievement {
  achievementId: number;
  data: {
    name: string;
    completed: boolean;
    category: {
      name: string;
      parent_category?: {
        name: string;
      }
    }
  };
}
