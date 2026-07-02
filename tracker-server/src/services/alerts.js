/* eslint-disable @typescript-eslint/no-require-imports */
const DatabaseService = require('./database');

class AlertsService {
    static async checkAll(vehicleId, statusData) {
        const db = DatabaseService.getInstance();

        try {
            // Verificar velocidade excessiva
            if (statusData.speed && statusData.speed > 120) {
                await this.createAlert(vehicleId, {
                    type: 'speed',
                    severity: 'high',
                    title: 'Velocidade Excessiva',
                    message: `Veículo ultrapassou ${statusData.speed} km/h`,
                });
            }

            // Verificar bateria baixa
            if (statusData.battery && statusData.battery < 20) {
                await this.createAlert(vehicleId, {
                    type: 'battery',
                    severity: 'medium',
                    title: 'Bateria Baixa',
                    message: `Bateria em ${statusData.battery}%`,
                });
            }

            // Verificar ignição sem movimento (possível problema)
            if (statusData.ignition && statusData.speed === 0) {
                // Alerta de ignição ligada sem movimento (pode ser normal, então severity baixa)
                console.log(`Veículo ${vehicleId}: Ignição ligada sem movimento`);
            }

        } catch (error) {
            console.error('Erro ao verificar alertas:', error);
        }
    }

    static async createAlert(vehicleId, alertData) {
        const db = DatabaseService.getInstance();

        try {
            const query = `
        INSERT INTO alerts (vehicle_id, type, severity, title, message, is_read, is_resolved, created_at)
        VALUES ($1, $2, $3, $4, $5, false, false, NOW())
        RETURNING id
      `;

            const values = [
                vehicleId,
                alertData.type,
                alertData.severity,
                alertData.title,
                alertData.message,
            ];

            const result = await db.query(query, values);
            console.log(`Alerta criado: ${alertData.title} para veículo ${vehicleId}`);

            // Alimentar notificações do dono do veículo (post-baseline-hardening 4.2)
            try {
                await db.query(
                    `INSERT INTO notifications (user_id, type, title, message, link)
                     SELECT v.user_id, $2, $3, $4, '/dashboard/alerts'
                     FROM vehicles v WHERE v.id = $1`,
                    [vehicleId, alertData.severity === 'critical' ? 'alert' : 'warning', alertData.title, alertData.message]
                );
            } catch (notifyError) {
                console.error('Erro ao criar notificação do alerta:', notifyError);
            }

            return result.rows[0];

        } catch (error) {
            console.error('Erro ao criar alerta:', error);
            throw error;
        }
    }
}

module.exports = AlertsService;
