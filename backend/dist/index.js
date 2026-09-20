"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const path_1 = require("path");
const fs_1 = require("fs");
dotenv_1.default.config();
const dataDir = process.env.VERCEL ? '/tmp/data' : (0, path_1.join)(process.cwd(), 'data');
if (!(0, fs_1.existsSync)(dataDir)) {
    (0, fs_1.mkdirSync)(dataDir, { recursive: true });
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', api_1.default);
app.get('/', (req, res) => {
    res.json({
        name: 'USMLE Step 2 CK Practice API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            questions: '/api/questions/*',
            reviews: '/api/reviews/*',
            progress: '/api/progress/*',
            exams: '/api/exams/*'
        }
    });
});
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map