export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          type: 'car' | 'motorcycle' | 'truck' | 'boat' | 'jetski';
          plate: string;
          model: string | null;
          year: string | null;
          color: string | null;
          device_imei: string | null;
          device_model: string | null;
          device_sim: string | null;
          device_last_maintenance: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          type: 'car' | 'motorcycle' | 'truck' | 'boat' | 'jetski';
          plate: string;
          model?: string | null;
          year?: string | null;
          color?: string | null;
          device_imei?: string | null;
          device_model?: string | null;
          device_sim?: string | null;
          device_last_maintenance?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          type?: 'car' | 'motorcycle' | 'truck' | 'boat' | 'jetski';
          plate?: string;
          model?: string | null;
          year?: string | null;
          color?: string | null;
          device_imei?: string | null;
          device_model?: string | null;
          device_sim?: string | null;
          device_last_maintenance?: string | null;
          created_at?: string;
        };
      };
      vehicle_status: {
        Row: {
          vehicle_id: number;
          status: 'online' | 'offline';
          is_moving: boolean;
          last_update: string | null;
          lat: number | null;
          lng: number | null;
          address: string | null;
          speed: number;
          direction: string | null;
          ignition: boolean;
          battery: number | null;
          satellites: number;
        };
        Insert: {
          vehicle_id: number;
          status?: 'online' | 'offline';
          is_moving?: boolean;
          last_update?: string | null;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          speed?: number;
          direction?: string | null;
          ignition?: boolean;
          battery?: number | null;
          satellites?: number;
        };
        Update: {
          vehicle_id?: number;
          status?: 'online' | 'offline';
          is_moving?: boolean;
          last_update?: string | null;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          speed?: number;
          direction?: string | null;
          ignition?: boolean;
          battery?: number | null;
          satellites?: number;
        };
      };
      trips: {
        Row: {
          id: number;
          vehicle_id: number;
          start_time: string;
          end_time: string | null;
          duration_seconds: number | null;
          distance_meters: number | null;
          start_lat: number | null;
          start_lng: number | null;
          start_address: string | null;
          end_lat: number | null;
          end_lng: number | null;
          end_address: string | null;
          max_speed: number | null;
          avg_speed: number | null;
        };
        Insert: {
          id?: number;
          vehicle_id: number;
          start_time: string;
          end_time?: string | null;
          duration_seconds?: number | null;
          distance_meters?: number | null;
          start_lat?: number | null;
          start_lng?: number | null;
          start_address?: string | null;
          end_lat?: number | null;
          end_lng?: number | null;
          end_address?: string | null;
          max_speed?: number | null;
          avg_speed?: number | null;
        };
        Update: {
          id?: number;
          vehicle_id?: number;
          start_time?: string;
          end_time?: string | null;
          duration_seconds?: number | null;
          distance_meters?: number | null;
          start_lat?: number | null;
          start_lng?: number | null;
          start_address?: string | null;
          end_lat?: number | null;
          end_lng?: number | null;
          end_address?: string | null;
          max_speed?: number | null;
          avg_speed?: number | null;
        };
      };
      events: {
        Row: {
          id: number;
          vehicle_id: number;
          trip_id: number | null;
          type: 'ignition_on' | 'ignition_off' | 'speed_alert' | 'movement_start' | 'movement_stop' | 'panic' | 'battery_low' | 'geofence_enter' | 'geofence_exit' | 'location_update';
          timestamp: string;
          lat: number | null;
          lng: number | null;
          address: string | null;
          speed: number | null;
          ignition: boolean | null;
          battery: number | null;
          details: Json | null;
        };
        Insert: {
          id?: number;
          vehicle_id: number;
          trip_id?: number | null;
          type: 'ignition_on' | 'ignition_off' | 'speed_alert' | 'movement_start' | 'movement_stop' | 'panic' | 'battery_low' | 'geofence_enter' | 'geofence_exit' | 'location_update';
          timestamp?: string;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          speed?: number | null;
          ignition?: boolean | null;
          battery?: number | null;
          details?: Json | null;
        };
        Update: {
          id?: number;
          vehicle_id?: number;
          trip_id?: number | null;
          type?: 'ignition_on' | 'ignition_off' | 'speed_alert' | 'movement_start' | 'movement_stop' | 'panic' | 'battery_low' | 'geofence_enter' | 'geofence_exit' | 'location_update';
          timestamp?: string;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          speed?: number | null;
          ignition?: boolean | null;
          battery?: number | null;
          details?: Json | null;
        };
      };
      alerts: {
        Row: {
          id: number;
          user_id: string;
          vehicle_id: number | null;
          event_id: number | null;
          type: 'ignition' | 'movement' | 'speed' | 'panic' | 'battery' | 'offline' | 'geofence';
          message: string;
          timestamp: string;
          read: boolean;
        };
        Insert: {
          id?: number;
          user_id: string;
          vehicle_id?: number | null;
          event_id?: number | null;
          type: 'ignition' | 'movement' | 'speed' | 'panic' | 'battery' | 'offline' | 'geofence';
          message: string;
          timestamp?: string;
          read?: boolean;
        };
        Update: {
          id?: number;
          user_id?: string;
          vehicle_id?: number | null;
          event_id?: number | null;
          type?: 'ignition' | 'movement' | 'speed' | 'panic' | 'battery' | 'offline' | 'geofence';
          message?: string;
          timestamp?: string;
          read?: boolean;
        };
      };
      settings: {
        Row: {
          user_id: string;
          notifications_enabled: boolean;
          speed_alert_enabled: boolean;
          speed_alert_value: number;
          ignition_alert_enabled: boolean;
          movement_alert_enabled: boolean;
          panic_alert_enabled: boolean;
          battery_alert_enabled: boolean;
          geofence_alert_enabled: boolean;
          map_type: string;
          dark_mode: boolean;
          measurement_unit: string;
          language: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          notifications_enabled?: boolean;
          speed_alert_enabled?: boolean;
          speed_alert_value?: number;
          ignition_alert_enabled?: boolean;
          movement_alert_enabled?: boolean;
          panic_alert_enabled?: boolean;
          battery_alert_enabled?: boolean;
          geofence_alert_enabled?: boolean;
          map_type?: string;
          dark_mode?: boolean;
          measurement_unit?: string;
          language?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          notifications_enabled?: boolean;
          speed_alert_enabled?: boolean;
          speed_alert_value?: number;
          ignition_alert_enabled?: boolean;
          movement_alert_enabled?: boolean;
          panic_alert_enabled?: boolean;
          battery_alert_enabled?: boolean;
          geofence_alert_enabled?: boolean;
          map_type?: string;
          dark_mode?: boolean;
          measurement_unit?: string;
          language?: string;
          updated_at?: string;
        };
      };
      geofences: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          description: string | null;
          type: 'circle' | 'polygon';
          coordinates: Json;
          radius_meters: number | null;
          alert_on_enter: boolean;
          alert_on_exit: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          description?: string | null;
          type: 'circle' | 'polygon';
          coordinates: Json;
          radius_meters?: number | null;
          alert_on_enter?: boolean;
          alert_on_exit?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          description?: string | null;
          type?: 'circle' | 'polygon';
          coordinates?: Json;
          radius_meters?: number | null;
          alert_on_enter?: boolean;
          alert_on_exit?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 