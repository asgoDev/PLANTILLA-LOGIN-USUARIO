class DashboardController {
    constructor({ dashboardService }) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/stats
     */
    async getStats(req, res, next) {
        try {
            const stats = await this.dashboardService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

export default DashboardController;
