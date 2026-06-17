import { Router, type IRouter } from "express";
import healthRouter from "./health";
import treatmentsRouter from "./treatments";
import clinicsRouter from "./clinics";
import destinationsRouter from "./destinations";
import slotsRouter from "./slots";
import packagesRouter from "./packages";
import costRouter from "./cost-comparison";
import testimonialsRouter from "./testimonials";
import contactRouter from "./contact";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/treatments", treatmentsRouter);
router.use("/clinics", clinicsRouter);
router.use("/destinations", destinationsRouter);
router.use("/slots", slotsRouter);
router.use("/packages", packagesRouter);
router.use("/cost-comparison", costRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/contact", contactRouter);
router.use("/dashboard", dashboardRouter);
router.use("/admin", adminRouter);
router.use("/chat", chatRouter);

export default router;
