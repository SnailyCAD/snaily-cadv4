import { Feature, CourtDate, CourtEntry, Officer, SeizedItem, Violation } from "@prisma/client";
import type { CREATE_TICKET_SCHEMA, CREATE_TICKET_SCHEMA_BUSINESS } from "@snailycad/schemas";
import { PaymentStatus, RecordType, WhitelistStatus } from "@snailycad/types";
import { NotFound } from "@tsed/exceptions";
import { userProperties } from "lib/auth/getSessionUser";
import { isFeatureEnabled } from "lib/cad";
import { leoProperties } from "lib/leo/activeOfficer";
import { prisma } from "lib/data/prisma";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { ExtendedNotFound } from "src/exceptions/extended-not-found";
import type { z } from "zod";
import { validateRecordData } from "./validate-record-data";
import { captureException } from "@sentry/node";

interface UpsertRecordOptions {
  data: z.infer<typeof CREATE_TICKET_SCHEMA | typeof CREATE_TICKET_SCHEMA_BUSINESS>;
  recordId: string | null;
  cad: { features?: Record<Feature, boolean> };
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

  let citizen;
  let business;
  if ("citizenId" in options.data && options.data.citizenId) {
    citizen = await prisma.citizen.findUnique({
      where: { id: options.data.citizenId },
    });

    if (!citizen) {
      throw new ExtendedNotFound({ citizenId: "citizenNotFound" });
    }
  } else if ("businessId" in options.data && options.data.businessId) {
    business = await prisma.business.findUnique({
      where: { id: options.data.businessId },
    });

    if (!business) {
      throw new ExtendedNotFound({ businessId: "businessNotFound" });
    }
  }

  if (options.data.vehicleId) {
    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id: options.data.vehicleId },
    });

    if (!vehicle) {
      throw new ExtendedNotFound({ plateOrVin: "vehicleNotFound" });
    }
  }

  if (!business && !citizen) {
    throw new ExtendedBadRequest({ citizenId: "citizenOrBusinessNotFound" });
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
      citizenId: citizen?.id,
      businessId: business?.id,
      officerId: options.officer?.id ?? null,
      notes: options.data.notes,
      postal: String(options.data.postal),
      status: recordStatus,
      address: options.data.address,
      paymentStatus: (options.data.paymentStatus ?? null) as PaymentStatus | null,
      vehicleId: options.data.vehicleId || null,
      vehicleColor: options.data.vehicleColor || null,
      vehicleModel: options.data.vehicleModel || null,
      vehiclePlate: options.data.plateOrVin || options.data.plateOrVinSearch,
      call911Id: options.data.call911Id || null,
      incidentId: options.data.incidentId || null,
    },
    update: {
      notes: options.data.notes,
      postal: options.data.postal,
      paymentStatus: (options.data.paymentStatus ?? null) as PaymentStatus | null,
      address: options.data.address,
      vehicleId: options.data.vehicleId || null,
      vehicleColor: options.data.vehicleColor || null,
      vehicleModel: options.data.vehicleModel || null,
      vehiclePlate: options.data.plateOrVin || options.data.plateOrVinSearch,
      call911Id: options.data.call911Id || null,
      incidentId: options.data.incidentId || null,
    },
    include: {
      officer: { include: leoProperties },
      citizen: { include: { user: { select: userProperties } } },
    },
  });

  let courtEntry: CourtEntry & { dates?: CourtDate[] } = null!;
  if (ticket.type !== "WRITTEN_WARNING" && options.data.courtEntry) {
    courtEntry = await prisma.courtEntry.create({
      data: {
        caseNumber: String(options.data.courtEntry.caseNumber || ticket.caseNumber),
        title: options.data.courtEntry.title,
        descriptionData: options.data.courtEntry.descriptionData,
      },
    });

    const dates = await prisma.$transaction(
      options.data.courtEntry.dates.map((date) =>
        prisma.courtDate.create({
          data: { date: new Date(date.date), note: date.note, courtEntryId: courtEntry.id },
        }),
      ),
    );

    await prisma.record.update({
      where: { id: ticket.id },
      data: { CourtEntryId: courtEntry.id },
    });

    courtEntry = { ...courtEntry, dates };
  }

  if (ticket.type === "ARREST_REPORT" && !options.recordId && citizen) {
    await prisma.citizen.update({
      where: { id: citizen.id },
      data: { arrested: true },
    });
  }

  const validatedViolationsResults = await Promise.allSettled(
    options.data.violations.map((v) =>
      validateRecordData({ ...v, ticketId: ticket.id, cad: options.cad }),
    ),
  );
  const fullFilledValidatedViolations = validatedViolationsResults
    .filter((v) => v.status === "fulfilled")
    // @ts-expect-error - we know it's fulfilled
    .map((v) => v.value) as Awaited<ReturnType<typeof validateRecordData>>[];

  const failedValidatedViolations = validatedViolationsResults
    .filter((v) => v.status === "rejected")
    // @ts-expect-error - we know it's rejected
    .map((v) => v.reason);

  if (failedValidatedViolations.length >= 1) {
    captureException({
      message: "Unable to validate violations",
      violations: JSON.stringify(failedValidatedViolations),
    });
  }

  const errors = fullFilledValidatedViolations.reduce(
    (prev, current) => ({ ...prev, ...current.errors }),
    {},
  );

  if (Object.keys(errors).length >= 1) {
    await prisma.record.delete({ where: { id: ticket.id } });
    throw new ExtendedBadRequest(errors);
  }

  const violations = await prisma.$transaction(
    fullFilledValidatedViolations.map((item) => {
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

  return { ...ticket, violations, seizedItems, courtEntry };
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
