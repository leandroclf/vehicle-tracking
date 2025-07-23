// Tipos para sistema de comandos remotos
export interface VehicleCommand {
  id: string;
  vehicle_id: string;
  user_id: string;
  type: CommandType;
  status: CommandStatus;
  confirmation_required: boolean;
  confirmation_token?: string;
  confirmation_expires_at?: Date;
  executed_at?: Date;
  response_data?: any;
  created_at: Date;
  updated_at: Date;
}

export type CommandType = 
  | 'block_vehicle'
  | 'unblock_vehicle'
  | 'activate_siren'
  | 'deactivate_siren'
  | 'flash_lights'
  | 'request_location'
  | 'emergency_stop';

export type CommandStatus = 
  | 'pending_confirmation'
  | 'confirmed'
  | 'sent_to_device'
  | 'executed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface CommandConfirmation {
  command_id: string;
  confirmation_token: string;
  confirmed_by: string;
  confirmed_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface CommandResponse {
  command_id: string;
  device_response: any;
  execution_time: number;
  success: boolean;
  error_message?: string;
  received_at: Date;
}

export interface CreateCommandRequest {
  vehicle_id: string;
  type: CommandType;
  confirmation_required?: boolean;
  metadata?: Record<string, any>;
}

export interface ConfirmCommandRequest {
  command_id: string;
  confirmation_token: string;
}