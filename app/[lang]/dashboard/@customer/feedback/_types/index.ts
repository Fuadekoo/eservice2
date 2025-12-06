export interface Feedback {
  id: string;
  requestId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  requestDate: string;
}

export interface RequestWithFeedback {
  id: string;
  date: string;
  createdAt: string;
  service: {
    id: string;
    name: string;
    description: string;
    office: {
      id: string;
      name: string;
      address: string;
    };
  };
  customerSatisfaction?: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

