import { Router } from "express";
import { prisma } from "lib/prisma";
import { isAuthorized } from "middleware/auth";

const router = Router();

router.get("/:category", isAuthorized(["ViewFireDepartmentProtocols"]), async (req, res) => {
  const { category } = req.params;
  const protocols = await prisma[category].findMany();
  res.json(protocols);
});

router.post("/:category", isAuthorized(["ManageFireDepartmentProtocols"]), async (req, res) => {
  const { category } = req.params;
  const protocol = await prisma[category].create({ data: req.body });
  res.status(201).json(protocol);
});

router.put("/:category/:id", isAuthorized(["ManageFireDepartmentProtocols"]), async (req, res) => {
  const { category, id } = req.params;
  const protocol = await prisma[category].update({
    where: { id: Number(id) },
    data: req.body,
  });
  res.json(protocol);
});

router.delete("/:category/:id", isAuthorized(["ManageFireDepartmentProtocols"]), async (req, res) => {
  const { category, id } = req.params;
  await prisma[category].delete({ where: { id: Number(id) } });
  res.status(204).send();
});

export default router;
