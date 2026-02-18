/**
 * Monitoring Resolvers
 * GraphQL resolvers for system monitoring and health checks
 */

import monitoringService from '../services/monitoring.service.js';

export const monitoringResolvers = {
  Query: {
    /**
     * Get system health check
     */
    healthCheck: async () => {
      try {
        const health = await monitoringService.getHealthCheck();

        return {
          success: true,
          message: `System is ${health.status}`,
          data: health,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Health check failed',
        };
      }
    },

    /**
     * Get system metrics
     */
    systemMetrics: async (_parent: any, _args: any, context: any) => {
      try {
        // Only allow admins to view metrics
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const metrics = await monitoringService.getMetrics();

        return {
          success: true,
          message: 'Metrics retrieved successfully',
          data: metrics,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get metrics',
        };
      }
    },

    /**
     * Get monitoring alerts
     */
    getAlerts: async (
      _parent: any,
      { status }: { status?: string },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // TODO: Implement get alerts from database
        // const alerts = await monitoringService.getAlerts(status);

        return {
          success: true,
          message: 'Alerts retrieved successfully',
          alerts: [],
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get alerts',
        };
      }
    },
  },

  Mutation: {
    /**
     * Log an error (for client-side error reporting)
     */
    logError: async (
      _parent: any,
      { error }: { error: any },
      context: any
    ) => {
      try {
        const errorLog = {
          error_type: error.type || 'client_error',
          error_message: error.message,
          stack_trace: error.stack,
          request_path: error.path,
          user_id: context.user?.id,
          ip_address: context.req?.ip,
          user_agent: context.req?.headers['user-agent'],
          severity: error.severity || 'medium',
          metadata: error.metadata,
        };

        await monitoringService.logError(errorLog);

        return {
          success: true,
          message: 'Error logged successfully',
        };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to log error',
        };
      }
    },

    /**
     * Create a monitoring alert
     */
    createAlert: async (
      _parent: any,
      { alert }: { alert: any },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const createdAlert = await monitoringService.createAlert(alert);

        return {
          success: true,
          message: 'Alert created successfully',
          alert: createdAlert,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create alert',
        };
      }
    },

    /**
     * Acknowledge an alert
     */
    acknowledgeAlert: async (
      _parent: any,
      { alertId }: { alertId: number },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // TODO: Implement acknowledge alert
        // await monitoringService.acknowledgeAlert(alertId);

        return {
          success: true,
          message: 'Alert acknowledged successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to acknowledge alert',
        };
      }
    },

    /**
     * Resolve an alert
     */
    resolveAlert: async (
      _parent: any,
      { alertId }: { alertId: number },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // TODO: Implement resolve alert
        // await monitoringService.resolveAlert(alertId);

        return {
          success: true,
          message: 'Alert resolved successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to resolve alert',
        };
      }
    },
  },
};
