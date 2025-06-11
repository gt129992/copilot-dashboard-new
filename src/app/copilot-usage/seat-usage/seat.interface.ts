export interface Seat {
  assignee?: { login?: string };
  created_at?: string;
  updated_at?: string;
  last_activity_at?: string;
  last_activity_editor?: string;
  pending_cancellation_date?: string;
  // Add any other fields as needed
}
