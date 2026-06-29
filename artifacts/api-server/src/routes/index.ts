import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysesRouter from "./analyses";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysesRouter);
router.use(statsRouter);

export default router;
