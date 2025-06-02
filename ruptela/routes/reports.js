// ruptela/routes/reports.js
import { Router } from 'express';
import { pool_db } from '../connection/connection.js';
import jwt from 'jsonwebtoken';

export const router_reports = Router();

// Middleware de autenticación (opcional)
const authenticateToken = (req, res, next) => {
    const { authorization } = req.headers;
    
    if (!authorization) {
        return res.status(401).json({ error: true, data: 'auth_token_not_provided' });
    }
    
    try {
        const decoded = jwt.verify(authorization, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: true, data: 'jwt_malformed' });
    }
};

// Obtener todo el personal activo
router_reports.get('/personnel', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                name, 
                role,
                active,
                created_at
            FROM personnel 
            WHERE active = true 
            ORDER BY role, name
        `;
        
        const { rows } = await pool_db.query(query);
        
        return res.json({ 
            error: false, 
            data: rows,
            total: rows.length 
        });
        
    } catch (error) {
        console.error('Error fetching personnel:', error);
        return res.status(500).json({ 
            error: true, 
            message: 'Error al obtener personal',
            details: error.message 
        });
    }
});

// Obtener todos los equipos (excavadoras y volquetes)
router_reports.get('/equipment', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                code, 
                plate, 
                type,
                active,
                created_at
            FROM equipment 
            WHERE active = true 
            ORDER BY 
                CASE 
                    WHEN type = 'excavadora' THEN 1 
                    WHEN type = 'volquete' THEN 2 
                    ELSE 3 
                END,
                code
        `;
        
        const { rows } = await pool_db.query(query);
        
        // Separar por tipo para facilitar el uso en el frontend
        const equipment = {
            excavadoras: rows.filter(item => item.type === 'excavadora'),
            volquetes: rows.filter(item => item.type === 'volquete'),
            all: rows
        };
        
        return res.json({ 
            error: false, 
            data: equipment 
        });
        
    } catch (error) {
        console.error('Error fetching equipment:', error);
        return res.status(500).json({ 
            error: true, 
            message: 'Error al obtener equipos',
            details: error.message 
        });
    }
});

// Obtener volquetes asociados a una excavadora específica
router_reports.get('/equipment/volquetes-by-excavadora/:excavadoraId', async (req, res) => {
    try {
        const { excavadoraId } = req.params;
        
        // Validar que el ID sea un número
        if (!excavadoraId || isNaN(excavadoraId)) {
            return res.status(400).json({
                error: true,
                message: 'ID de excavadora inválido'
            });
        }
        
        const query = `
            SELECT 
                e.id, 
                e.code, 
                e.plate, 
                e.type,
                ev.created_at as association_date
            FROM equipment e
            INNER JOIN excavadora_volquetes ev ON e.id = ev.volquete_id
            WHERE ev.excavadora_id = $1 
                AND e.active = true 
                AND e.type = 'volquete'
            ORDER BY e.code
        `;
        
        const { rows } = await pool_db.query(query, [excavadoraId]);
        
        return res.json({ 
            error: false, 
            data: rows,
            total: rows.length,
            excavadora_id: excavadoraId
        });
        
    } catch (error) {
        console.error('Error fetching volquetes for excavadora:', error);
        return res.status(500).json({ 
            error: true, 
            message: 'Error al obtener volquetes asociados',
            details: error.message 
        });
    }
});

// Obtener información detallada de una excavadora
router_reports.get('/equipment/excavadora/:excavadoraId', async (req, res) => {
    try {
        const { excavadoraId } = req.params;
        
        const excavadoraQuery = `
            SELECT id, code, plate, type, active, created_at
            FROM equipment 
            WHERE id = $1 AND type = 'excavadora' AND active = true
        `;
        
        const volquetesQuery = `
            SELECT 
                e.id, 
                e.code, 
                e.plate, 
                e.type
            FROM equipment e
            INNER JOIN excavadora_volquetes ev ON e.id = ev.volquete_id
            WHERE ev.excavadora_id = $1 AND e.active = true
            ORDER BY e.code
        `;
        
        const [excavadoraResult, volquetesResult] = await Promise.all([
            pool_db.query(excavadoraQuery, [excavadoraId]),
            pool_db.query(volquetesQuery, [excavadoraId])
        ]);
        
        if (excavadoraResult.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Excavadora no encontrada'
            });
        }
        
        const excavadora = excavadoraResult.rows[0];
        const volquetes = volquetesResult.rows;
        
        return res.json({
            error: false,
            data: {
                ...excavadora,
                volquetes_asociados: volquetes,
                total_volquetes: volquetes.length
            }
        });
        
    } catch (error) {
        console.error('Error fetching excavadora details:', error);
        return res.status(500).json({
            error: true,
            message: 'Error al obtener detalles de excavadora',
            details: error.message
        });
    }
});

// Guardar registro de reporte generado (para auditoría)
router_reports.post('/save-report', authenticateToken, async (req, res) => {
    try {
        const { 
            reportType, 
            reportData, 
            fechaReporte, 
            turno,
            metadata 
        } = req.body;
        
        // Validaciones
        if (!reportType || !reportData || !fechaReporte || !turno) {
            return res.status(400).json({
                error: true,
                message: 'Faltan campos obligatorios'
            });
        }
        
        // Validar tipo de reporte
        const validReportTypes = ['control-origen', 'ingreso-chute'];
        if (!validReportTypes.includes(reportType)) {
            return res.status(400).json({
                error: true,
                message: 'Tipo de reporte inválido'
            });
        }
        
        const query = `
            INSERT INTO generated_reports (
                report_type, 
                report_data, 
                generated_by, 
                fecha_reporte, 
                turno,
                metadata,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, created_at
        `;
        
        const values = [
            reportType,
            JSON.stringify(reportData),
            req.user?.id || null, // ID del usuario autenticado
            fechaReporte,
            turno,
            JSON.stringify(metadata || {})
        ];
        
        const { rows } = await pool_db.query(query, values);
        
        return res.json({ 
            error: false, 
            data: {
                report_id: rows[0].id,
                created_at: rows[0].created_at,
                message: 'Reporte guardado exitosamente'
            }
        });
        
    } catch (error) {
        console.error('Error saving report:', error);
        return res.status(500).json({ 
            error: true, 
            message: 'Error al guardar reporte',
            details: error.message 
        });
    }
});

// Obtener historial de reportes generados
router_reports.get('/history', authenticateToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            reportType, 
            dateFrom, 
            dateTo,
            turno 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (reportType) {
            whereConditions.push(`report_type = $${paramIndex++}`);
            queryParams.push(reportType);
        }
        
        if (dateFrom) {
            whereConditions.push(`fecha_reporte >= $${paramIndex++}`);
            queryParams.push(dateFrom);
        }
        
        if (dateTo) {
            whereConditions.push(`fecha_reporte <= $${paramIndex++}`);
            queryParams.push(dateTo);
        }
        
        if (turno) {
            whereConditions.push(`turno = $${paramIndex++}`);
            queryParams.push(turno);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
        
        const countQuery = `
            SELECT COUNT(*) as total
            FROM generated_reports
            ${whereClause}
        `;
        
        const dataQuery = `
            SELECT 
                id,
                report_type,
                fecha_reporte,
                turno,
                generated_by,
                created_at,
                (report_data->>'responsableNombre') as responsable,
                (report_data->>'controladorNombre') as controlador
            FROM generated_reports
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        queryParams.push(limit, offset);
        
        const [countResult, dataResult] = await Promise.all([
            pool_db.query(countQuery, queryParams.slice(0, -2)),
            pool_db.query(dataQuery, queryParams)
        ]);
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        
        return res.json({
            error: false,
            data: dataResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        console.error('Error fetching report history:', error);
        return res.status(500).json({
            error: true,
            message: 'Error al obtener historial de reportes',
            details: error.message
        });
    }
});

// Obtener estadísticas de reportes
router_reports.get('/stats', authenticateToken, async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                report_type,
                turno,
                DATE(fecha_reporte) as fecha,
                COUNT(*) as cantidad
            FROM generated_reports
            WHERE fecha_reporte >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY report_type, turno, DATE(fecha_reporte)
            ORDER BY fecha DESC, report_type, turno
        `;
        
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_reportes,
                COUNT(DISTINCT fecha_reporte) as dias_con_reportes,
                COUNT(DISTINCT generated_by) as usuarios_activos
            FROM generated_reports
            WHERE fecha_reporte >= CURRENT_DATE - INTERVAL '30 days'
        `;
        
        const [statsResult, summaryResult] = await Promise.all([
            pool_db.query(statsQuery),
            pool_db.query(summaryQuery)
        ]);
        
        return res.json({
            error: false,
            data: {
                daily_stats: statsResult.rows,
                summary: summaryResult.rows[0]
            }
        });
        
    } catch (error) {
        console.error('Error fetching report stats:', error);
        return res.status(500).json({
            error: true,
            message: 'Error al obtener estadísticas',
            details: error.message
        });
    }
});

export default router_reports;