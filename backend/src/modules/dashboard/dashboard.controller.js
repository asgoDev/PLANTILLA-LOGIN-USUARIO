import { successResponse } from '../../shared/dtos/response.dto.js';

class DashboardController {
    constructor({ dashboardService }) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/stats
     */
    async getStats(req, res, next) {
        try {
            const { role, id: userId } = req.user;
            const stats = await this.dashboardService.getStats(role, userId);
            res.json(successResponse(stats));
        } catch (error) {
            next(error);
        }
    }
}

export default DashboardController;

