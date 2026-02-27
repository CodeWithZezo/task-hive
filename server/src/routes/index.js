import { Router } from 'express';
import authRoutes from './auth.routes.js';
// More routes added per module:
// import userRoutes from './user.routes.js';
// import workspaceRoutes from './workspace.routes.js';
// import projectRoutes from './project.routes.js';
// import taskRoutes from './task.routes.js';
// import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/workspaces', workspaceRoutes);
// router.use('/projects', projectRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/notifications', notificationRoutes);

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🐝 TaskHive API v1',
    version: '1.0.0',
    docs: '/api/v1/docs',
  });
});

export default router;