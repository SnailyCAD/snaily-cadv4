import type { Officer, SeizedItem, Violation } from "@prisma/client";
import type { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";
import { cad, Feature, PaymentStatus, RecordType, WhitelistStatus } from "@snailycad/types";
import { NotFound } from "@tsed/exceptions";
import { userProperties } from "lib/auth/getSessionUser";
import { isFeatureEnabled } from "lib/cad";
import { leoProperties } from "lib/leo/activeOfficer";
import { prisma } from "lib/prisma";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import type { z } from "zod";
import { validateRecordData } from "./validateRecordData";

interface UpsertRecordOptions {
  data: z.infer<typeof CREATE_TICKET_SCHEMA>;
  recordId: string | null;
  cad: cad;
  officer: Officer | null;
}

export async function upsertRecord(options: UpsertRecordOptions) {
  if (options.recordId) {
    const record = await prisma.record.findUnique({
      where: { id: options.recordId },
      include: { violations: true, seizedItems: true },
    });

    if (!record) {
      throw new NotFound("notFound");
    }

    await Promise.all([unlinkViolations(record.violations), unlinkSeizedItems(record.seizedItems)]);
  }

  const citizen = await prisma.citizen.findUnique({
    where: { id: options.data.citizenId },
  });

  if (!citizen) {
    throw new ExtendedNotFound({ citizenId: "citizenNotFound" });
  }

  const isApprovalEnabled = isFeatureEnabled({
    defaultReturn: false,
    feature: Feature.CITIZEN_RECORD_APPROVAL,
    features: options.cad.features,
  });
  const recordStatus = isApprovalEnabled ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED;

  const ticket = await prisma.record.upsert({
    where: { id: String(options.recordId) },
    create: {
      type: options.data.type as RecordType,
      citizenId: citizen.id,
      officerId: options.officer?.id ?? null,
      notes: options.data.notes,
      postal: String(options.data.postal),
      status: recordStatus,
      paymentStatus: (options.data.paymentStatus ?? null) as PaymentStatus | null,
    },
    update: {
      notes: options.data.notes,
      postal: options.data.postal,
      paymentStatus: (options.data.paymentStatus ?? null) as PaymentStatus | null,
    },
    include: {
      officer: { include: leoProperties },
      citizen: { include: { user: { select: userProperties } } },
    },
  });

  if (ticket.type === "ARREST_REPORT" && !options.recordId) {
    await prisma.citizen.update({
      where: { id: citizen.id },
      data: { arrested: true },
    });
  }

  const validatedViolations = await Promise.all(
    options.data.violations.map((v) =>
      validateRecordData({ ...v, ticketId: ticket.id, cad: options.cad }),
    ),
  );

  const violations = await prisma.$transaction(
    validatedViolations.map((item) => {
      return prisma.violation.create({
        data: {
          counts: item.counts,
          fine: item.fine,
          bail: item.bail,
          jailTime: item.jailTime,
          penalCode: { connect: { id: item.penalCodeId } },
          records: { connect: { id: ticket.id } },
        },
        include: {
          penalCode: { include: { warningApplicable: true, warningNotApplicable: true } },
        },
      });
    }),
  );

  const seizedItems = await prisma.$transaction(
    (options.data.seizedItems ?? []).map((item) => {
      return prisma.seizedItem.create({
        data: {
          item: item.item,
          illegal: item.illegal ?? false,
          quantity: item.quantity ?? 1,
          recordId: ticket.id,
        },
      });
    }),
  );

  return { ...ticket, violations, seizedItems };
}

async function unlinkViolations(violations: Pick<Violation, "id">[]) {
  await Promise.all(
    violations.map(async ({ id }) => {
      await prisma.violation.delete({ where: { id } });
    }),
  );
}

async function unlinkSeizedItems(items: Pick<SeizedItem, "id">[]) {
  await Promise.all(
    items.map(async ({ id }) => {
      await prisma.seizedItem.delete({ where: { id } });
    }),
  );
}
