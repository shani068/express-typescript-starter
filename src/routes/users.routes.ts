import { Router } from "express";

import { getUser, updateUser } from "@/controllers/users.controller";
import { requireAuth, sessionUser } from "@/middleware/require-auth";
import { updateUserSchema } from "@/schemas/users.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         email: { type: string, format: email }
 *         createdAt: { type: string, format: date-time }
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             message: { type: string }
 *             details:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   path: { type: string }
 *                   message: { type: string }
 *
 * /api/v1/users/me:
 *   get:
 *     summary: Get the signed-in user's profile
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: The profile
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/User" }
 *       401:
 *         description: Not signed in
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 *   put:
 *     summary: Update the signed-in user's profile
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *     responses:
 *       200:
 *         description: The updated profile
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/User" }
 *       400:
 *         description: Validation failed (including unknown fields)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 *       401:
 *         description: Not signed in
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 */
router.get("/me", requireAuth, async (req, res) => {
  res.json(await getUser(sessionUser(req).id));
});

router.put("/me", requireAuth, async (req, res) => {
  const input = updateUserSchema.parse(req.body);
  res.json(await updateUser(sessionUser(req).id, input));
});

export default router;
