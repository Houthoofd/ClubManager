/**
 * Generated TypeScript types for settings domain
 * @generated - Do not edit manually
 */

export interface Settings {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type?: "string" | "number" | "boolean" | "json";
  /** Catégorie du paramètre */
  category?: string;
  description?: string;
  /** 1 si visible publiquement, 0 sinon */
  is_public?: boolean;
  updated_at?: string;
}

export interface SettingsInsert {
  setting_key: string;
  setting_value: string;
  setting_type?: "string" | "number" | "boolean" | "json";
  /** Catégorie du paramètre */
  category?: string;
  description?: string;
  /** 1 si visible publiquement, 0 sinon */
  is_public?: boolean;
}

export interface SettingsUpdate {
  setting_key?: string;
  setting_value?: string;
  setting_type?: "string" | "number" | "boolean" | "json";
  /** Catégorie du paramètre */
  category?: string;
  description?: string;
  /** 1 si visible publiquement, 0 sinon */
  is_public?: boolean;
  updated_at?: string;
}

// ============================================
// Health & Monitoring Types
// ============================================

export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version?: string;
  checks: HealthCheckDetail[];
}

export interface HealthCheckDetail {
  name: string;
  status: "up" | "down" | "degraded";
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface DatabaseHealthCheck extends HealthCheckDetail {
  name: "database";
  connectionPool?: {
    active: number;
    idle: number;
    total: number;
  };
}

export interface RedisHealthCheck extends HealthCheckDetail {
  name: "redis";
  ping?: boolean;
  memory?: {
    used: number;
    peak: number;
  };
}

export interface MetricsSnapshot {
  timestamp: string;
  http: HttpMetrics;
  system: SystemMetrics;
  business?: BusinessMetrics;
}

export interface HttpMetrics {
  requests_total: number;
  requests_duration_seconds: {
    count: number;
    sum: number;
    buckets: Record<string, number>;
  };
  requests_by_status: Record<string, number>;
  requests_by_path: Record<string, number>;
  active_connections: number;
}

export interface SystemMetrics {
  process_cpu_usage: number;
  process_memory_bytes: number;
  process_heap_bytes: number;
  process_uptime_seconds: number;
  nodejs_version: string;
  event_loop_lag_seconds?: number;
}

export interface BusinessMetrics {
  active_users?: number;
  total_orders?: number;
  revenue_total?: number;
  [key: string]: any;
}

export interface MonitoringAlert {
  id: number;
  alert_type:
    | "metric_threshold"
    | "error_rate"
    | "latency"
    | "downtime"
    | "custom";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  metric_name?: string;
  threshold_value?: number;
  current_value?: number;
  triggered_at: string;
  resolved_at?: string;
  status: "active" | "acknowledged" | "resolved";
  metadata?: Record<string, any>;
}

export interface MonitoringAlertInsert {
  alert_type:
    | "metric_threshold"
    | "error_rate"
    | "latency"
    | "downtime"
    | "custom";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  metric_name?: string;
  threshold_value?: number;
  current_value?: number;
  triggered_at: string;
  metadata?: Record<string, any>;
}

export interface MonitoringAlertUpdate {
  status?: "active" | "acknowledged" | "resolved";
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: number;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  request_path?: string;
  request_method?: string;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  severity: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ErrorLogInsert {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  request_path?: string;
  request_method?: string;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  id: number;
  metric_name: string;
  metric_value: number;
  metric_unit: "ms" | "bytes" | "count" | "percent";
  endpoint?: string;
  operation?: string;
  tags?: Record<string, string>;
  recorded_at: string;
}

export interface PerformanceMetricInsert {
  metric_name: string;
  metric_value: number;
  metric_unit: "ms" | "bytes" | "count" | "percent";
  endpoint?: string;
  operation?: string;
  tags?: Record<string, string>;
  recorded_at?: string;
}
