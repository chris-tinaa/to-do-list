/**
 * List model interface
 * @see docs/prd.md section 5.2
 */
export interface List {
  id: string; // UUID
  userId: string; // UUID
  name: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  taskCount: number;
  completedTaskCount: number;
} 


/**
 * List creation input interface
 */
export interface CreateListInput {
  /** ID of the user creating the list */
  userId: string;
  /** Name of the list */
  name: string;
  /** Optional description of the list */
  description?: string;
}

/**
 * List update input interface
 */
export interface UpdateListInput {
  /** Updated name of the list */
  name?: string;
  /** Updated description of the list */
  description?: string;
}

/**
 * List with basic info (without task counts for lightweight operations)
 */
export interface ListBasic {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * List summary for dashboard/overview displays
 */
export interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
  completedTaskCount: number;
  completionPercentage: number;
  lastUpdated: Date;
}