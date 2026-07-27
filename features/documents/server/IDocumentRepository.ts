import type {
  CreateDocumentRecordInput,
  DocumentRecord,
  ListOwnedDocumentRecordsInput,
  UpdateDocumentRecordContentInput,
  UpdateDocumentRecordTitleInput,
} from "@/features/documents/models";

export interface IDocumentRepository {
  create(input: CreateDocumentRecordInput): Promise<DocumentRecord>;
  listOwned(input: ListOwnedDocumentRecordsInput): Promise<DocumentRecord[]>;
  findById(id: string): Promise<DocumentRecord | null>;
  updateTitle(input: UpdateDocumentRecordTitleInput): Promise<DocumentRecord>;
  deleteById(id: string): Promise<void>;
  updateContentIfVersionMatches(
    input: UpdateDocumentRecordContentInput,
  ): Promise<number>;
}
