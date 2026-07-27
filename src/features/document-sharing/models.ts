export type DocumentShareRole = "EDITOR";

export interface DocumentShareUserRecord {
  id: string;
  name: string;
  email: string;
}

export interface DocumentShareRecord {
  documentId: string;
  userId: string;
  role: DocumentShareRole;
  createdAt: Date;
  updatedAt: Date;
  user: DocumentShareUserRecord;
}

export interface ShareTargetRecord extends DocumentShareUserRecord {}

export interface DocumentShareSummary {
  user: DocumentShareUserRecord;
  role: DocumentShareRole;
  createdAt: string;
}

export interface DocumentShareListResult {
  items: DocumentShareSummary[];
}

export interface EligibleShareUsersResult {
  items: ShareTargetRecord[];
}

export interface GrantDocumentShareResult {
  share: DocumentShareSummary;
  created: boolean;
}
