export interface CopilotLanguage {
  name: string;
  total_code_lines_suggested?: number;
  total_code_lines_accepted?: number;
  total_code_suggestions?: number;
  total_code_acceptances?: number;
  total_engaged_users?: number;
}

export interface CopilotModel {
  languages: CopilotLanguage[];
}

export interface CopilotEditor {
  models: CopilotModel[];
}

export interface CopilotIDECodeCompletions {
  editors: CopilotEditor[];
}

export interface CopilotIDEChatEditor {
  total_engaged_users?: number;
  models: unknown[];
  total_chats?: number;
  total_chat_copy_events?: number;
  total_chat_insertion_events?: number;
}

export interface CopilotIDEChat {
  editors: CopilotIDEChatEditor[];
}

export interface CopilotMetrics {
  date: string;
  total_active_users?: number;
  total_engaged_users?: number;
  copilot_ide_code_completions?: CopilotIDECodeCompletions;
  copilot_ide_chat?: CopilotIDEChat;
}
