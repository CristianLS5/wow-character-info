export interface Achievement {
  achievementId: number;
  data: {
    id: number;
    name: string;
    description: string;
    points: number;
    is_account_wide: boolean;
    display_order: number;
    category: {
      key: {
        href: string;
      };
      name: string;
      id: number;
      parent_category?: {
        id: number;
        name: string;
      };
    };
    next_achievement?: {
      key: {
        href: string;
      };
      name: string;
      id: number;
    };
    media: {
      key: {
        href: string;
      };
      id: number;
      assets: Array<{
        key: string;
        value: string;
        file_data_id?: number;
      }>;
    };
    criteria?: {
      id: number;
      description: string;
      amount: number;
      operator: {
        type: string;
        name: string;
      };
      child_criteria?: Array<{
        id: number;
        description: string;
        amount: number;
      }>;
    };
  };
  createdAt: string;
  lastUpdated: string;
  updatedAt: string;
}
