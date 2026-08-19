import { successResponse } from '../../shared/dtos/response.dto.js';
import { toDashboardStatsDTO } from '../../shared/dtos/dashboard.dto.js';

class DashboardController {
    constructor({ dashboardService }) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/stats
     */
    async getStats(req, res, next) {
        try {
            const stats = await this.dashboardService.getStats(req.user);
            res.json(successResponse(toDashboardStatsDTO(stats)));
        } catch (error) {
            next(error);
        }
    }
}

export default DashboardController;
